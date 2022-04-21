// pages/edit.js
var canvas=null;
var ctx=null;
const dpr=wx.getSystemInfoSync().pixelRatio;

var canvasElements={
    type:null,
    state_counter:0,
    state:[],
    func:[],
};

var operations=null;
var last_x,last_y;

function operation_undo_rollback() {
    let ud=[];
    let rb=[];
    this.push=function(){
        ud.push(JSON.stringify(canvasElements));
        if(ud.length>16){
            ud=ud.slice(1);
        }
        rb=[];
    }
    this.pop=function(){
        ud.pop();
    }
    this.undo=function(){
        if(ud.length==0)
            return;
        rb.push(JSON.stringify(canvasElements));
        canvasElements=JSON.parse(ud.pop());
    }
    this.rollback=function(){
        if(rb.length==0)
            return;
        ud.push(JSON.stringify(canvasElements));
        canvasElements=JSON.parse(rb.pop());
    }
    this.undo_size=function(){
        return ud.length;
    }
    this.rollback_size=function(){
        return rb.length;
    }
}

function propertyParse(str){
    let vec=str.split("");
    if(vec.length<5 || (vec.length==5 && (vec[1]!=";" || vec[3]!=";"))){
        wx.showToast({
            title: '格式错误,正确格式: -;-;-',
            icon: 'none',
            duration: 2500
        });
        return false;
    }else if(vec.length>5){
        wx.showToast({
            title: '输入输出与移动方向必须都为单个字符',
            icon: 'none',
            duration: 2500
        })
        return false;
    }
    if(vec[4]!="R" && vec[4]!="L" && vec[4]!="S"){
        wx.showToast({
          title: '指针移动方向必须为R,L,S中的一个',
          icon: 'none',
          duration: 2500
        });
        return false;
    }
    return true;
}

Page({
    /**
     * 页面的初始数据
     */
    data: {
        width:null,
        height:null,
        isLongTap:false,
        selectedState:null,
        filename:"untitled.json",
        filedata:{},
        operand_type:"select",
        successSaveFile:false,
        cancelSaveFile:false
    },

    /**
     * 根据名称查找状态
     */
    findState: function(name) {
        let vec=canvasElements.state;
        for(let i=0;i<vec.length;i++)
            if(vec[i].name==name)
                return vec[i];
        return null;
    },

    /**
     * 寻找距离点击处最近的状态，并且更新颜色
     */
    findColorNearestState: function(x,y) {
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
    findColorNearestStateName: function(x,y){
        let state=this.findColorNearestState(x,y);
        return (state==null)?null:state.name;
    },

    /**
     * 寻找被点击的线段
     */
    findNearestFunc: function(x,y){
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
        ctx.font="10rpx sans-serif"
        ctx.textAlign="center";
        ctx.textBaseline="middle";
    },

    /**
     * 绘制状态
     */
    drawState: function(name,x,y,r,color) {
        ctx.strokeStyle="#606266";
        // draw circle
        ctx.beginPath();
        ctx.arc(x,y,r,0,2*Math.PI);
        ctx.fillStyle=color;
        ctx.fill();
        ctx.stroke();
        // set text
        ctx.fillStyle="#606266";
        ctx.fillText(name,x,y);
    },

    /**
     * 绘制初态侧面三角形
     */
    drawStateStart: function(x,y,r) {
        ctx.strokeStyle="#606266";
        ctx.fillStyle="#e1f3d8";
        ctx.beginPath();
        ctx.moveTo(x-r,y);
        ctx.lineTo(x-r-0.5*r,y-0.7*r);
        ctx.lineTo(x-r-0.5*r,y+0.7*r);
        ctx.lineTo(x-r,y);
        ctx.fill();
        ctx.stroke();
    },

    /**
     * 绘制终态的小圆环
     */
    drawStateEnd: function(x,y,r) {
        ctx.strokeStyle="#606266";
        ctx.beginPath();
        ctx.arc(x,y,r,0,2*Math.PI);
        ctx.stroke();
    },

    /**
     * 绘制选择圆环
     */
    drawCircleSelectPanel: function(x,y,r,isStart=0,isEnd=0) {
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
        canvasElements.func.forEach(elem =>{
            if(elem.begin_state==null){ // no need to render invalid connection
                return;
            }else{
                let state=this.findState(elem.begin_state);
                elem.begin_x=state.x;
                elem.begin_y=state.y;
            }
            if(elem.end_state!=null){ // end state maybe null, then use end_x end_y
                let state=this.findState(elem.end_state);
                elem.end_x=state.x;
                elem.end_y=state.y;
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
        canvasElements.state.forEach(elem=>{
            this.drawState(elem.name,elem.x,elem.y,15,elem.fillcolor);
            if(elem.isEnd)
                this.drawStateEnd(elem.x,elem.y,11);
            if(elem.isStart)
                this.drawStateStart(elem.x,elem.y,15);
        });
    },

    /**
     * 页面加载时加载文件
     * 在有文件的时候用JSON初始化组件列表
     */
    loadExistFile: function(filename) {
        try{
            const res=this.fs.readFileSync(
                `${wx.env.USER_DATA_PATH}/turingmachinesimulator/`+filename,
                'utf8',0);
            canvasElements=JSON.parse(res);
        }catch(e){ // empty file
            console.error(e);
        }
    },

    /**
     * 页面加载时加载文件
     * 在没有文件时初始化组件列表
     */
    createTemporaryFile: function(type) {
        canvasElements.type=type;       // get type of automata
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
            this.createTemporaryFile(options.type);
        }
        /* if options include filename, set it */
        if("filename" in options)
            this.setData({
                filename:options.filename
            });
        wx.setNavigationBarTitle({
            title: this.data.filename,
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
        try{
            const res=wx.getSystemInfoSync();
            this.setData({
                height:res.windowHeight,
                width:res.windowWidth
            });
            this.canvasDraw();
        }catch(e){
            console.error(e);
        }
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        wx.setNavigationBarTitle({
            title: this.data.filename,
        });
        // successfully save file in savefile page
        if(this.data.successSaveFile)
            wx.showToast({
                title: '创建成功',
                icon: 'success',
                duration: 1000
            });
        // cancel saving file in savefile page
        else if(this.data.cancelSaveFile)
            wx.showToast({
                title: '取消创建',
                icon: 'error',
                duration: 1000
            });
        // reset
        this.setData({
            successSaveFile:false,
            cancelSaveFile:false
        });
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
        let name=this.data.filename;
        canvasElements.state.forEach(elem=>{
            elem.fillcolor="#ffe985";
        });
        this.setData({filedata:canvasElements});
        if(name=="untitled.json"){
            wx.navigateTo({url: '/pages/savefile/savefile?type='+canvasElements.type});
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
        this.setData({
            filedata:canvasElements
        });
        wx.navigateTo({
            url: "/pages/simulator/simulator?type=fromedit",
        });
    },

    /**
     * 单次点击创建新状态
     */
    tapState: function(x,y){
        canvasElements.state.push({
            x:x,y:y,
            name:"q"+String(canvasElements.state_counter),
            fillcolor:"#ffe985",
            isStart:0,
            isEnd:0
        });
        canvasElements.state_counter+=1;
    },

    /**
     * select下长按状态的选择
     */
    longTapSelect: function(x,y){
        let state=this.data.selectedState;
        if(state==null)
            return;
        let start_x=state.x;
        let start_y=state.y;
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
        for(var i=0;i<canvasElements.func.length;i++){
            if(canvasElements.func[i].begin_state==selectState.name|| 
                canvasElements.func[i].end_state==selectState.name){
                canvasElements.func.splice(i,1);
                i--;
            }
        }
        for(var i=0;i<canvasElements.state.length;i++){
            if(canvasElements.state[i]==selectState){
                canvasElements.state.splice(i,1);
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
            }
        }
    },

    /** 
     * canvas单次点击事件
     */
    tap: function (e) {
        let x=e.detail.x-e.target.offsetLeft;
        let y=e.detail.y-e.target.offsetTop;
        let opr=this.data.operand_type;
        let flush=this.canvasDraw;
        if(opr=="select"){
            let state=this.findColorNearestState(x,y);
            let transfer=this.findNearestFunc(x,y);
            if(state==null && transfer!=null){
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
                                if(r.confirm && propertyParse(r.content)){
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
                            if(isstr && propertyParse(res.content)){
                                operations.push();
                                transfer.text=res.content;
                                flush();
                            }else if(!isstr){
                                multiple_transfer_set(Number(res.content));
                            }
                        }
                    }
                });
            }
        }else if(opr=="delete"){
            let state=this.findColorNearestState(x,y);
            let transfer=this.findNearestFunc(x,y);
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
        let opr=this.data.operand_type;
        if(opr=="select"){
            let state=this.findColorNearestState(x,y);
            if(state!=null){
                operations.push();
                // last_x/y is used to make sure the state
                // is really moved for a bit of range
                last_x=state.x;
                last_y=state.y;
            }
            // this operation binds 'select move', 'select set init/final'
            this.setData({
                isLongTap:false,
                selectedState:state
            });
            this.canvasDraw();
        }else if(opr=="state"){
            operations.push();
            this.tapState(x,y);
            this.canvasDraw();
        }else if(opr=="func"){
            let name=this.findColorNearestStateName(x,y);
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
        let x=e.changedTouches[0].x;
        let y=e.changedTouches[0].y;
        let opr=this.data.operand_type;
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
            this.longTapSelect(x,y);
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
            this.canvasDraw();
        }else if(opr=="func"){
            let vec=canvasElements.func;
            let index=vec.length-1;
            vec[index].end_state=this.findColorNearestStateName(x,y);
            if(vec[index].begin_state==null || vec[index].end_state==null){
                // cancel creating new transfer, pop
                vec.pop();
                operations.pop();
                this.canvasDraw();
            }else{
                let flush=this.canvasDraw;
                wx.showModal({
                    title:"从"+vec[index].begin_state+"到"+vec[index].end_state,
                    editable:true,
                    placeholderText:vec[index].text,
                    success(res){
                        if(res.cancel){
                            vec.pop();
                            operations.pop();
                            flush();
                            return;
                        }
                        let parse_result=propertyParse(res.content);
                        if(!parse_result){
                            vec.pop();
                            operations.pop();
                            flush();
                            return;
                        }
                        vec[index].text=res.content;
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
            let state=this.findColorNearestState(x,y);
            if(state!=null){
                this.setData({isLongTap:true});
                this.drawCircleSelectPanel(state.x,state.y,15,state.isStart,state.isEnd);
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
                    success(res){wx.showToast({title:'保存成功',icon:'success',duration:1000});},
                    fail(err){
                        if(err.errMsg=="saveImageToPhotosAlbum:fail auth deny"){
                            wx.navigateTo({url:'/pages/auth/auth?info=无图片保存权限，请设置',});
                        }else{
                            wx.showToast({title:'取消保存',icon:'error',duration:1000});
                        }
                    }
                });
            }
        });
    },

    undo: function() {
        if(operations.undo_size()==0)
            return;
        operations.undo();
        this.canvasDraw();
    },

    rollback: function() {
        if(operations.rollback_size()==0)
            return;
        operations.rollback();
        this.canvasDraw();
    }
})