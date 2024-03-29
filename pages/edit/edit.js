// pages/edit.js
var canvas = null;
var ctx = null;
const dpr = wx.getSystemInfoSync().pixelRatio;
var page_filename = "untitled.json";
var success_save = false;
var cancel_save = false;

var canvasElements = {
    type:null,
    state_counter:0,
    state:[],
    func:[],
};

var operations=null;
var last_x,last_y;

function operation_undo_rollback() {
    let ud = [];
    let rb = [];

    this.push = function() {
        ud.push(JSON.stringify(canvasElements));
        if (ud.length>16) {
            ud = ud.slice(1);
        }
        rb = [];
    }

    this.pop = function() {
        ud.pop();
    }

    this.undo = function() {
        if (ud.length==0) {
            return;
        }
        rb.push(JSON.stringify(canvasElements));
        canvasElements = JSON.parse(ud.pop());
    }

    this.rollback = function() {
        if (rb.length==0) {
            return;
        }
        ud.push(JSON.stringify(canvasElements));
        canvasElements = JSON.parse(rb.pop());
    }

    this.undo_size = function() {
        return ud.length;
    }

    this.rollback_size = function() {
        return rb.length;
    }
}

function propertyParse(str){
    if(str.length<5 || (str.length==5 && (str[1]!=";" || str[3]!=";"))){
        wx.showToast({
            title: '格式错误,正确格式: -;-;-',
            icon: 'none',
            duration: 2500
        });
        return false;
    }else if(str.length>5){
        wx.showToast({
            title: '输入输出与移动方向必须都为单个字符',
            icon: 'none',
            duration: 2500
        })
        return false;
    }
    if(str[4]!="R" && str[4]!="L" && str[4]!="S"){
        wx.showToast({
          title: '指针移动方向必须为R,L,S中的一个',
          icon: 'none',
          duration: 2500
        });
        return false;
    }
    return true;
}

function multiplePropertyParse(str){
    const tapes=canvasElements.tape;
    const len=6*tapes-1;
    if(str.length<len || str.length>len){
        wx.showToast({
            title: '格式错误',
            icon: 'none',
            duration: 800
        });
        return false;
    }
    for(let i=0;i<len;i+=6){
        if(str[i+1]!=";" || str[i+3]!=";" || (i+5!=len && str[i+5]!="|")){
            wx.showToast({
                title: '格式错误: '+str[i]+str[i+1]+str[i+2]+str[i+3]+str[i+4],
                icon: 'none',
                duration: 800
            });
            return false;
        }
        if(str[i+4]!="R" && str[i+4]!="L" && str[i+4]!="S"){
            wx.showToast({
              title: '指针移动方向必须为R,L,S中的一个',
              icon: 'none',
              duration: 2500
            });
            return false;
        }
    }
    return true;
}

Page({
    /**
     * 页面的初始数据
     */
    data: {
        isLongTap:false,
        selectedState:null,
        operand_type:"select",
        hasModule:false,
        touch_start_cordx:0,
        touch_start_cordy:0,
        touch_start_stamp:0,
        touch_end_stamp:0
    },

    /**
     * 根据名称查找状态
     */
    findState: function(name) {
        for(const state of canvasElements.state) {
            if (state.name === name) {
                return state;
            }
        }
        return null;
    },

    /**
     * 寻找距离点击处最近的状态，并且更新颜色
     */
    findColorNearestState: function(x, y) {
        let dis=1e6;
        let tmp={};
        canvasElements.state.forEach(elem => {
            elem.fillcolor="#ffe985";
            let t=Math.sqrt(Math.pow(x-elem.x,2)+Math.pow(y-elem.y,2));
            if(t<=dis){
                tmp=elem;
                dis=t;
            }
        });
        if(dis<=15){
            tmp.fillcolor="#88c3ff";
            return tmp;
        }
        return null;
    },
    
    /**
     * 寻找距离点击处最近的状态，并且更新颜色
     * 只返回名称
     */
    findColorNearestStateName: function(x, y) {
        const state = this.findColorNearestState(x, y);
        return (state==null)? null:state.name;
    },

    /**
     * 寻找被点击的线段
     */
    findNearestFunc: function(x, y) {
        //求点到线的距离
        let dis=1e6;
        let tmp={};
        var t,A,B;
        canvasElements.func.forEach(elem=>{
            if(elem.isAlone){
                if(elem.begin_state==elem.end_state){
                    t=Math.sqrt(Math.pow(x-(elem.begin_x-22),2)+Math.pow(y-(elem.begin_y+22),2));
                    if(t<=dis){
                        tmp=elem;
                        dis=t;
                    }
                }else{
                    if(elem.end_x==elem.begin_x)
                        t=Math.abs(x-elem.end_x);
                    else if(x>Math.min(elem.begin_x,elem.end_x) && y>Math.min(elem.begin_y,elem.end_y) &&
                        x<Math.max(elem.begin_x,elem.end_x) && y<Math.max(elem.begin_y,elem.end_y)){
                        A=(elem.begin_y-elem.end_y)/(elem.begin_x-elem.end_x);
                        B=elem.begin_y-A*elem.begin_x;
                        t=Math.abs((A*x+B-y)/Math.sqrt(A*A+1));
                        if(t<=dis){
                            tmp=elem;
                            dis=t;
                        }
                    }
                }
            }else{
                let bx=elem.begin_x;
                let by=elem.begin_y;
                let ex=elem.end_x;
                let ey=elem.end_y;
                if(x<Math.max(ex,bx) && x>Math.min(ex,bx) && 
                    y<Math.max(ey,by) && y>Math.min(ey,by)){
                    let O_x,O_y,m=10,k=(ey-by)/(ex-bx); //圆心,凸点距离直线距离
                    let M=Math.sqrt((ey-by)*(ey-by)+(ex-bx)*(ex-bx))/2; //直线长度的一半
                    let R=(M*M+m*m)/(m*2); //圆半径
                    let i=(R-m)/Math.sqrt(k*k+1);
                    if(bx<ex && by<ey){
                        O_x=(ex+bx)/2-Math.abs(k)*i;
                        O_y=(ey+by)/2+i;
                    }else if(bx>ex && by>ey){
                        O_x=(ex+bx)/2+Math.abs(k)*i;
                        O_y=(ey+by)/2-i;
                    }else if(bx<ex && by>ey){
                        O_x=Math.abs(k)*i+(ex+bx)/2;
                        O_y=(ey+by)/2+i;
                    }else{
                        O_x=(ex+bx)/2-Math.abs(k)*i;
                        O_y=(ey+by)/2-i;
                    }
                    t=Math.abs(Math.sqrt((x-O_x)*(x-O_x)+(y-O_y)*(y-O_y))-R);
                    if(t<=dis){
                        tmp=elem;
                        dis=t;
                    }
                }
            }
        });
        if(dis<=7)
            return tmp;
        return null;
    },

    /** 
     * 初始化文字格式 
     */
    textStyle: function() {
        ctx.font = "10rpx sans-serif"
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
    },

    /**
     * 绘制状态
     */
    drawState: function(state) {
        const name = state.name;
        const x = state.x;
        const y = state.y;
        const r = 15;
        const color = state.fillcolor;
        ctx.strokeStyle = "#606266";
        // draw circle
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2*Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.stroke();
        // set text
        ctx.fillStyle = "#606266";
        ctx.fillText(name, x, y);
    },

    /**
     * 绘制初态侧面三角形
     */
    drawStateStart: function(state) {
        const x = state.x;
        const y = state.y;
        const r = 15; // radius
        ctx.strokeStyle = "#606266";
        ctx.fillStyle = "#e1f3d8";
        ctx.beginPath();
        ctx.moveTo(x-r, y);
        ctx.lineTo(x-r-0.5*r, y-0.7*r);
        ctx.lineTo(x-r-0.5*r, y+0.7*r);
        ctx.lineTo(x-r, y);
        ctx.fill();
        ctx.stroke();
    },

    /**
     * 绘制终态的小圆环
     */
    drawStateEnd: function(state) {
        ctx.strokeStyle = "#606266";
        ctx.beginPath();
        ctx.arc(state.x, state.y, 12, 0, 2*Math.PI);
        ctx.stroke();
    },

    /**
     * 绘制子程序节点的特别部分
    */
    drawSubProgram: function(state) {
        const x = state.x;
        const y = state.y;
        ctx.save();
        ctx.strokeStyle = "#606266";
        ctx.fillStyle = "#e1f3d8";
        ctx.beginPath();
        ctx.moveTo(x-6, y-9);
        ctx.lineTo(x+6, y-9);
        ctx.lineTo(x+6, y-7);
        ctx.lineTo(x-6, y-7);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        for(let i = -3; i<=3; i+=3){
            ctx.beginPath();
            ctx.moveTo(x+i, y-9);
            ctx.lineTo(x+i, y-7);
            ctx.stroke();
        }
        ctx.restore();
    },

    /**
     * 绘制选择圆环
     */
    drawCircleSelectPanel: function(state) {
        if (state === null || state === undefined) {
            return;
        }
        const x = state.x;
        const y = state.y;
        const isStart = state.isStart;
        const isEnd = state.isEnd;
        const r = 15;

        ctx.strokeStyle="#606266";
        // end state choice panel
        ctx.beginPath();
        ctx.moveTo(x,y-15);
        ctx.lineTo(x,y-2.5*r);
        ctx.arc(x,y,2.5*r,-0.5*Math.PI,0.5*Math.PI);
        ctx.lineTo(x,y+r);
        ctx.arc(x,y,r,0.5*Math.PI,-0.5*Math.PI,true);
        ctx.fillStyle=isEnd?"#e1f3d8":"#c0c4cc";
        ctx.fill();
        ctx.stroke();
        // start state choice panel
        ctx.beginPath();
        ctx.moveTo(x,y-15);
        ctx.lineTo(x,y-2.5*r);
        ctx.arc(x,y,2.5*r,-0.5*Math.PI,-1.5*Math.PI,true);
        ctx.lineTo(x,y+r);
        ctx.arc(x,y,r,0.5*Math.PI,-0.5*Math.PI);
        ctx.fillStyle=isStart?"#e1f3d8":"#c0c4cc";
        ctx.fill();
        ctx.stroke();
        // set text
        let nr=1.5;  // text offset
        ctx.fillStyle="#606266";
        ctx.fillText("初",x-nr*r,y-r);
        ctx.fillText("态",x-nr*r,y+r);
        ctx.fillText("终",x+nr*r,y-r);
        ctx.fillText("态",x+nr*r,y+r);
    },

    /**
     * 绘制直线箭头
     */
    drawArrow: function(bx,by,ex,ey,transfer) {
        ctx.strokeStyle="#606266";
        ctx.fillStyle="#606266";

        let angle=Math.atan2(ey-by,ex-bx);
        bx+=15*Math.cos(angle);
        by+=15*Math.sin(angle);
        ex-=15*Math.cos(angle);
        ey-=15*Math.sin(angle);
        angle=angle/Math.PI*180;

        ctx.beginPath();
        ctx.moveTo(bx,by);
        ctx.lineTo(ex,ey);
        ctx.stroke();
        
        let angle0=(30-angle)/180*Math.PI;
        let angle1=(60-angle)/180*Math.PI;
        ctx.beginPath();
        ctx.moveTo(ex,ey);
        ctx.lineTo(ex-8*Math.cos(angle0),ey+8*Math.sin(angle0));
        ctx.lineTo(ex-8*Math.sin(angle1),ey-8*Math.cos(angle1));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // fill text
        ctx.save();
        ctx.translate((bx+ex)/2,(by+ey)/2);
        if(angle<-90)     angle+=180;
        else if(angle>90) angle-=180;
        ctx.rotate(angle*Math.PI/180);
        ctx.fillText(transfer,0,-8);
        ctx.restore();
    },

    /**
     * 绘制弧线箭头
     */
     drawArcArrow: function(bx,by,ex,ey,transfer) {
        // avoid special situaion
        if(ex==bx)
            ex+=0.01;
        if(ey==by)
            ey+=0.01;
        ctx.strokeStyle="#606266";
        ctx.fillStyle="#606266";

        let O_x,O_y,m=10,k=(ey-by)/(ex-bx); //圆心,凸点距离状态圆心连线的直线距离
        let M=Math.sqrt((ey-by)*(ey-by)+(ex-bx)*(ex-bx))/2; //直线长度的一半
        let R=(M*M+m*m)/(m*2); //圆半径
        let i=(R-m)/Math.sqrt(k*k+1);
        if(bx<ex && by<ey){
            O_x=(ex+bx)/2-Math.abs(k)*i;
            O_y=(ey+by)/2+i;
        }else if(bx>ex && by>ey){
            O_x=(ex+bx)/2+Math.abs(k)*i;
            O_y=(ey+by)/2-i;
        }else if(bx<ex && by>ey){
            O_x=Math.abs(k)*i+(ex+bx)/2;
            O_y=(ey+by)/2+i;
        }else{
            O_x=(ex+bx)/2-Math.abs(k)*i;
            O_y=(ey+by)/2-i;
        }
        ctx.moveTo(bx,by);
        ctx.beginPath();
        let bAngle=Math.atan(Math.abs(by-O_y)/Math.abs(bx-O_x));
        let eAngle=Math.atan(Math.abs(ey-O_y)/Math.abs(ex-O_x));
        if(bx<O_x)
            bAngle=Math.PI+(O_y-by)/Math.abs(O_y-by)*bAngle;
        else
            bAngle=(by<O_y)?(2*Math.PI-bAngle):bAngle;
        if(ex<O_x)
            eAngle=Math.PI+(O_y-ey)/Math.abs(O_y-ey)*eAngle;
        else
            eAngle=(ey<O_y)?(2*Math.PI-eAngle):eAngle;
        ctx.arc(O_x,O_y,R,bAngle+Math.asin(15/R),eAngle-Math.asin(15/R));
        ctx.stroke();
        
        let ta_x,ta_y;
        if((ex<bx && O_y-ey<=7.5) || (ex>bx && ey>by && ey-O_y>=7.5)){
            if(ey<by || (ey>by && O_x-ex>7.5)){
                ta_x=ex+15*Math.abs(O_y-ey)/R;
                ta_y=ey+15*Math.abs(O_x-ex)/R;
            }else{
                ta_x=ex+15*Math.abs(O_y-ey)/R;
                ta_y=ey-15*Math.abs(O_x-ex)/R;
            }
        }else{
            if(ey>by || (ey<by && ex-O_x>7.5)){
                ta_x=ex-15*Math.abs(O_y-ey)/R;
                ta_y=ey-15*Math.abs(O_x-ex)/R;
            }else{
                ta_x=ex-15*Math.abs(O_y-ey)/R;
                ta_y=ey+15*Math.abs(O_x-ex)/R;
            }
        }
        
        let angle=Math.atan2(ey-by,ex-bx)/Math.PI*180;
        let angle0=(30-angle)/180*Math.PI;
        let angle1=(60-angle)/180*Math.PI;
        ctx.beginPath();
        ctx.moveTo(ta_x,ta_y);
        ctx.lineTo(ta_x-8*Math.cos(angle0),ta_y+8*Math.sin(angle0));
        ctx.lineTo(ta_x-8*Math.sin(angle1),ta_y-8*Math.cos(angle1));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // fill text
        let fill_x=O_x+((ex+bx)/2-O_x)*(R/(R-m));
        let fill_y=O_y+((ey+by)/2-O_y)*(R/(R-m));
        ctx.save();
        ctx.translate(fill_x,fill_y);
        if(angle<-90)     angle+=180;
        else if(angle>90) angle-=180;
        ctx.rotate(angle*Math.PI/180);
        ctx.fillStyle="#606266";
        if(ex<bx) ctx.fillText(transfer,0,8);
        else      ctx.fillText(transfer,0,-8);
        ctx.restore();
    },

    /**
     * 绘制指向自己的箭头
     */
    drawSelfArrow: function(x,y,transfer) {
        ctx.strokeStyle="#606266";
        x-=15;
        y+=15;
        ctx.beginPath();
        ctx.arc(x,y,10,0,1.5*Math.PI);  
        ctx.stroke();

        let angle=Math.PI/3;
        let res_sin=6.5*Math.sin(angle);
        let res_cos=6.5*Math.cos(angle);

        ctx.beginPath();
        ctx.moveTo(x,y-10);
        ctx.lineTo(x-res_cos,y-10+res_sin);
        ctx.lineTo(x-res_sin,y-10-res_cos);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // fill text
        ctx.fillText(transfer,x-4,y+16);
    },

    /**
     * canvas绘制刷新主函数
     */
    canvasDraw: function() {
        if(ctx==undefined)
            return;
        // background
        ctx.fillStyle="#f2f6fc";
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.beginPath();
        ctx.moveTo(1,1);
        ctx.lineTo(canvas.width/dpr-1,1);
        ctx.closePath();
        ctx.strokeStyle="#e4e7ed";
        ctx.stroke();

        this.textStyle(); // init text style
        // functions
        ctx.fillStyle="#000000"; // init fill style
        canvasElements.func.forEach(elem0 =>{
            elem0.isAlone=true;
            canvasElements.func.forEach(elem1 =>{
                if( elem0.begin_state == elem1.end_state && 
                    elem0.end_state == elem1.begin_state && 
                    elem0.begin_state != elem0.end_state){
                    elem0.isAlone=false;
                    elem1.isAlone=false;
                }
            });
        });
        canvasElements.func.forEach(elem => {
            if (elem.begin_state==null) { // no need to render invalid connection
                return;
            } else {
                const state = this.findState(elem.begin_state);
                elem.begin_x = state.x;
                elem.begin_y = state.y;
            }
            if (elem.end_state!=null) { // end state maybe null, then use end_x end_y
                const state = this.findState(elem.end_state);
                elem.end_x = state.x;
                elem.end_y = state.y;
            }
            if(elem.begin_x==elem.end_x && elem.begin_y==elem.end_y){
                this.drawSelfArrow(elem.begin_x,elem.begin_y,elem.text);
            }else if(elem.isAlone){
                this.drawArrow(elem.begin_x,elem.begin_y,elem.end_x,elem.end_y,elem.text);
            }else{
                this.drawArcArrow(elem.begin_x,elem.begin_y,elem.end_x,elem.end_y,elem.text);
            }
        });
        // states
        canvasElements.state.forEach(state => {
            const x = state.x;
            const y = state.y;
            this.drawState(state);
            if(state.isEnd)
                this.drawStateEnd(state);
            if(state.isStart)
                this.drawStateStart(state);
            if(state.isModule)
                this.drawSubProgram(state);
        });
    },

    /**
     * 页面加载时加载文件
     * 在有文件的时候用JSON初始化组件列表
     */
    loadExistFile: function(filename) {
        try{
            const res = this.fs.readFileSync(
                `${wx.env.USER_DATA_PATH}/turingmachinesimulator/`+filename,
                'utf8',
                0
            );
            canvasElements = JSON.parse(res);
        } catch(e) { // empty file
            console.error(e);
        }
    },

    /**
     * 页面加载时加载文件
     * 在没有文件时初始化组件列表
     */
    createTemporaryFile: function(type,tape=1) {
        canvasElements.type=type;       // get type of automata
        if(type=="multiple")
            canvasElements.tape=tape;
        canvasElements.state=[];        // empty vector
        canvasElements.func=[];         // empty vector
        canvasElements.state_counter=0; // set state name counter to 0
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        /* initializing */
        this.fs=wx.getFileSystemManager();
        if(options.type=="exist_file"){
            this.loadExistFile(options.filename);
        }else{
            this.createTemporaryFile(options.type,options.type=="multiple"?options.tapes:1);
        }
        if(canvasElements.type=="subprogram")
            this.setData({
                hasModule:true
            });
        /* if options include filename, set it */
        if("filename" in options){
            page_filename=options.filename;
        }else{
            page_filename="untitled.json";
        }
        wx.setNavigationBarTitle({
            title: page_filename,
        });
        operations=new operation_undo_rollback();
        wx.createSelectorQuery()
            .select('#canvas')
            .fields({node:true,size:true})
            .exec((res)=>{
                canvas=res[0].node;
                ctx=canvas.getContext('2d');

                canvas.width=res[0].width*dpr;
                canvas.height=res[0].height*dpr;
                ctx.scale(dpr,dpr);
                // draw exist file's machine structure
                this.canvasDraw();
            });
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {
        this.canvasDraw();
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        wx.setNavigationBarTitle({
            title: page_filename,
        });
        if(success_save){
            wx.showToast({
                title: '创建成功',
                icon: 'success',
                duration: 1000
            });
        }
        if(cancel_save){
            wx.showToast({
                title: '取消创建',
                icon: 'error',
                duration: 1000
            });
        }
        success_save=false;
        cancel_save=false;
        this.canvasDraw();
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {
        return {
            title:"编辑自动机",
            path:"/pages/edit/edit"
        }
    },

    /**
     * 按钮点击切换操作状态
     * 操作状态有:
     * select   选择
     * state    创建状态
     * func     创建转移函数
     * delete   删除组件
     * undo     撤销
     * rollback 回滚
     */
    tapButton: function (e) {
        this.setData({
            operand_type:e.currentTarget.dataset.param
        });
    },

    /**
     * 保存模型到文件
     */
    saveFile: function(e) {
        let name=page_filename;
        canvasElements.state.forEach(elem=>{
            elem.fillcolor="#ffe985";
        });
        if(name=="untitled.json"){
            wx.navigateTo({
                url: '/pages/savefile/savefile?type='+canvasElements.type,
                events:{
                    successSaveFile(data){
                        success_save=data.res;
                        page_filename=data.name;
                    },
                    cancelSaveFile(data){
                        cancel_save=data;
                    }
                },
                success(res){
                    res.eventChannel.emit("saveFileContext",JSON.stringify(canvasElements));
                }
            });
        }else{
            try{
                this.fs.writeFileSync(
                    `${wx.env.USER_DATA_PATH}/turingmachinesimulator/`+name,
                    JSON.stringify(canvasElements),
                    'utf8');
            }catch(e){
                console.error(e);
            }
        }
        return;
    },

    /** 
     * 跳转到模拟页面
    */
    gotoSimulator: function () {
        canvasElements.state.forEach(elem =>{
            elem.fillcolor="#ffe985";
        });
        wx.navigateTo({
            url: "/pages/simulator/simulator?type=fromedit",
            success(res){
                res.eventChannel.emit("temporaryMachine",JSON.stringify(canvasElements));
            }
        });
    },

    /**
     * 单次点击创建新状态
     */
    tapState: function(x,y,filename=""){
        canvasElements.state.push({
            x:x,y:y,
            name:"q"+String(canvasElements.state_counter),
            fillcolor:"#ffe985",
            isStart:0,
            isEnd:0,
            isModule:filename.length?1:0,
            moduleName:filename.length?filename:0
        });
        canvasElements.state_counter++;
    },

    /**
     * select下长按状态的选择
     */
    longTapSelect: function(x, y) {
        let state=this.data.selectedState;
        if(state==null)
            return;
        const start_x=state.x;
        const start_y=state.y;
        if(Math.pow((x-start_x),2)+Math.pow((y-start_y),2)>15*15){
            if(x<start_x){
                state.isStart=1-state.isStart;
            }else{
                state.isEnd=1-state.isEnd;
            }
        }else{
            // cancel setting init/final state, pop
            operations.pop();
        }
        this.canvasDraw();
    },

    /**
     * delete删除状态
     */
    deleteState: function(selectState){
        for(let i=0;i<canvasElements.func.length;i++){
            if(canvasElements.func[i].begin_state==selectState.name|| 
                canvasElements.func[i].end_state==selectState.name){
                canvasElements.func.splice(i,1);
                i--;
            }
        }
        for(let i=0;i<canvasElements.state.length;i++){
            if(canvasElements.state[i]==selectState){
                canvasElements.state.splice(i,1);
                break;
            }
        }
    },

    /**
     * delete删除转移关系
     */
    deleteTransfer: function(selectFunc){
        for(var i=0;i<canvasElements.func.length;i++){
            if(canvasElements.func[i]==selectFunc){
                canvasElements.func.splice(i,1);
                break;
            }
        }
    },

    /** 
     * canvas单次点击事件
     */
    tap: function (e) {
        if (this.data.touch_end_stamp-this.data.touch_start_stamp>350) {
            this.longTap(e);
            return;
        }
        const x=e.detail.x-e.target.offsetLeft;
        const y=e.detail.y-e.target.offsetTop;
        const opr=this.data.operand_type;
        const flush=this.canvasDraw;
        if (opr=="select") {
            const state = this.findColorNearestState(x, y);
            const transfer = this.findNearestFunc(x, y);
            if(state !== null && state.isModule)
                wx.showToast({
                    title: "子程序" + state.moduleName,
                    icon: "none",
                    duration: 800
                });
            if(state !== null && state !== undefined) {
                this.drawCircleSelectPanel(state);
                const state_is_start = state.isStart;
                const state_is_end = state.isEnd;
                const choices = [
                    state_is_start? "取消初态 | Cancel Start State":"设置初态 | Set Start State",
                    state_is_end?   "取消终态 | Cancel End State  ":"设置终态 | Set End State  "
                ]
                wx.showActionSheet({
                    itemList: choices,
                    success: (res) => {
                        operations.push();
                        switch(res.tapIndex) {
                            case 0: state.isStart = !state_is_start; break;
                            case 1: state.isEnd = !state_is_end; break;
                        }
                        flush();
                    }
                })
                return;
            }
            if (transfer === null) {
                return;
            }
            const isstr=(typeof(transfer.text)=="string");
            const title="从"+transfer.begin_state+"到"+transfer.end_state;
            let multiple_transfer_set=function(index){
                if(isNaN(index) || index<=0 || index>transfer.text.length){
                    wx.showToast({
                        title:"必须填写在数组长度范围内的正确数字",
                        icon:"none"
                    });
                }else{
                    wx.showModal({
                        title:"修改"+title+"的第"+index+"个转移函数",
                        placeholderText: transfer.text[index-1],
                        editable:true,
                        success(r){
                            if(r.cancel)
                                return;
                            const result=canvasElements.type=="multiple"?
                                multiplePropertyParse(r.content):
                                propertyParse(r.content);
                            if(result){
                                operations.push();
                                transfer.text[index-1]=r.content;
                                flush();
                            }
                        }
                    });
                }
                return;
            }
            wx.showModal({
                title: isstr?title:"修改"+title+"的第几个转移函数?",
                placeholderText: isstr?transfer.text:"",
                editable:true,
                success(res){
                    if(res.confirm){
                        if(isstr && (canvasElements.type=="multiple"?
                            multiplePropertyParse(res.content):
                            propertyParse(res.content))){
                            operations.push();
                            transfer.text=res.content;
                            flush();
                        }else if(!isstr){
                            multiple_transfer_set(Number(res.content));
                        }
                    }
                }
            });
        }else if(opr=="delete"){
            let state=this.findColorNearestState(x, y);
            let transfer=this.findNearestFunc(x, y);
            if(state!=null){
                let f=this.deleteState;
                wx.showModal({
                    title:'是否删除状态'+state.name,
                    success(res){
                        if(res.confirm){
                            operations.push();
                            f(state);
                            flush();
                        }
                    }
                });
            }else if(transfer!=null){
                let f=this.deleteTransfer;
                wx.showModal({
                    title:'是否删除从'+transfer.begin_state+'到'+transfer.end_state+'的转移',
                    success(res){
                        if(res.confirm){
                            operations.push();
                            f(transfer);
                            flush();
                        }
                    }
                });
            }
        }else if(opr=="module"){
            const subprog = this.tapState;
            const flush = this.canvasDraw;
            wx.navigateTo({
                url: '/pages/files/files?nav=module',
                events: {
                    getFile: function(data) {
                        operations.push();
                        subprog(x, y, data);
                        flush();
                    }
                }
            });
        }
        this.canvasDraw();
    },

    /**
     * canvas点击移动事件
     */
    touchMove: function(e) {
        let opr=this.data.operand_type;
        let current_x=e.changedTouches[0].x;
        let current_y=e.changedTouches[0].y;
        
        // edge detection
        if(current_x<0)
            current_x=0;
        if(current_x>=canvas.width/dpr)
            current_x=canvas.width/dpr;
        if(current_y<0)
            current_y=0;
        if(current_y>=canvas.height/dpr-e.target.offsetTop)
            current_y=canvas.height/dpr-e.target.offsetTop;
        
        if(opr=="select" && this.data.isLongTap==false && this.data.selectedState!=null){
            // this is select move operation
            let state=this.data.selectedState;
            state.x=current_x;
            state.y=current_y;
            this.canvasDraw();
        }else if(opr=="state"){
            let vec=canvasElements.state;
            let index=vec.length-1;
            vec[index].x=current_x;
            vec[index].y=current_y;
            this.canvasDraw();
        }else if(opr=="func"){
            let vec=canvasElements.func;
            let index=vec.length-1;
            if(vec[index].begin_state==null)
                return;
            vec[index].end_x=current_x;
            vec[index].end_y=current_y;
            vec[index].end_state=this.findColorNearestStateName(current_x,current_y);
            this.canvasDraw();
        }
    },

    /**
     * canvas点击移动开始
     */
    touchStart: function(e) {
        let x=e.touches[0].x;
        let y=e.touches[0].y;
        this.setData({touch_start_stamp:e.timeStamp, touch_start_cordx:x, touch_start_cordy:y});
        let opr=this.data.operand_type;
        if(opr=="select"){
            let state=this.findColorNearestState(x, y);
            if(state!=null){
                operations.push();
                // last_x/y is used to make sure the state
                // is really moved for a bit of range
                last_x = state.x;
                last_y = state.y;
            }
            // this operation binds 'select move', 'select set init/final'
            this.setData({
                isLongTap:false,
                selectedState:state
            });
            this.canvasDraw();
        }else if(opr=="state"){
            operations.push();
            this.tapState(x, y);
            this.canvasDraw();
        }else if(opr=="func"){
            let name=this.findColorNearestStateName(x, y);
            operations.push();
            canvasElements.func.push({
                begin_x:x,begin_y:y,
                end_x:x,end_y:y,
                text:" ",
                begin_state:name,
                end_state:name
            });
            this.canvasDraw();
        }
    },

    /**
     * canvas点击移动结束
     */
    touchEnd: function(e) {
        this.setData({touch_end_stamp:e.timeStamp});
        let x=e.changedTouches[0].x;
        let y=e.changedTouches[0].y;
        let opr=this.data.operand_type;
        let flush=this.canvasDraw;
        // edge detection
        if(x<0)
            x=0;
        if(x>=canvas.width/dpr)
            x=canvas.width/dpr;
        if(y<0)
            y=0;
        if(y>=canvas.height/dpr-e.target.offsetTop)
            y=canvas.height/dpr-e.target.offsetTop;
        
        if(this.data.isLongTap){
            // this is select set init/final state operation
            this.longTapSelect(x, y);
            this.setData({selectedState:null});
        }else if(opr=="select" && this.data.selectedState!=null){
            let state=this.data.selectedState;
            let range=Math.sqrt((last_x-state.x)*(last_x-state.x)+(last_y-state.y)*(last_y-state.y));
            if(range<5){
                // move range is too short, pop
                operations.pop();
            }
        }else if(opr=="state"){
            let vec=canvasElements.state;
            let index=vec.length-1;
            vec[index].x=x;
            vec[index].y=y;
            flush();
        }else if(opr=="func"){
            let vec=canvasElements.func;
            let index=vec.length-1;
            vec[index].end_state=this.findColorNearestStateName(x, y);
            if(vec[index].begin_state==null || vec[index].end_state==null){
                // cancel creating new transfer, pop
                vec.pop();
                operations.pop();
                flush();
            }else{
                wx.showModal({
                    title:"从"+vec[index].begin_state+"到"+vec[index].end_state,
                    editable:true,
                    placeholderText:vec[index].text,
                    success(res){
                        let default_text="ε;ε;S";
                        if(canvasElements.type=="multiple")
                            for(let i=1;i<canvasElements.tape;i++)
                                default_text+="|ε;ε;S";
                        if(res.cancel){
                            vec[index].text=default_text;
                        }else{
                            let parse_res=canvasElements.type=="multiple"?
                                multiplePropertyParse(res.content):
                                propertyParse(res.content);
                            vec[index].text=parse_res?res.content:default_text;
                        }
                        // check different transfers have same begin/end state
                        for(let i=0;i<vec.length-1;i++){
                            if(vec[i].begin_state==vec[index].begin_state &&
                                vec[i].end_state==vec[index].end_state){
                                    let exist=false;
                                    if(typeof(vec[i].text)!="string"){
                                        vec[i].text.forEach(e=>{if(e==vec[index].text)exist=true;});
                                    }else{
                                        exist=(vec[i].text==vec[index].text);
                                    }
                                    if(exist){
                                        vec.pop();
                                        operations.pop();
                                        break;
                                    }
                                    if(typeof(vec[i].text)!="string"){
                                        vec[i].text.push(vec[index].text);
                                    }else{
                                        vec[i].text=[vec[i].text,vec[index].text];
                                    }
                                    vec.pop();
                                    break;
                                }
                        }
                        flush();
                    }
                });
            }
        }
        this.setData({isLongTap:false});
    },

    /**
     * canvas长按事件 
     */
    longTap: function(e) {
        let x=e.touches[0].x;
        let y=e.touches[0].y;
        let opr=this.data.operand_type;

        if(opr=="select"){
            // draw select panel
            let state=this.findColorNearestState(x, y);
            if(state!=null){
                this.setData({isLongTap:true});
                this.drawCircleSelectPanel(state);
            }
        }
    },

    /**
     *  保存为图片
     */
    savePic: function(e) {
        wx.canvasToTempFilePath({
            canvas:canvas,
            fileType:'png',
            success(res){
                wx.saveImageToPhotosAlbum({
                    filePath: res.tempFilePath,
                    success(res){
                        wx.showToast({title:'保存成功',icon:'success',duration:800});
                    },
                    fail(err){
                        if(err.errMsg=="saveImageToPhotosAlbum:fail auth deny"){
                            wx.navigateTo({url:'/pages/auth/auth?info=请设置图片保存权限',});
                        }else{
                            wx.showToast({title:'保存失败',icon:'error',duration:800});
                        }
                    }
                });
            }
        });
    },

    undo: function() {
        if (operations.undo_size()==0) {
            return;
        }
        operations.undo();
        this.canvasDraw();
    },

    rollback: function() {
        if (operations.rollback_size()==0) {
            return;
        }
        operations.rollback();
        this.canvasDraw();
    }
})