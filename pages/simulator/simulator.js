// pages/simulator/simulator.js
var canvas=null;
var ctx=null;
const dpr=wx.getSystemInfoSync().pixelRatio;
var canvasElements=null;
var simu_panel_pos=null;
var instance=null;

// queue data structure
function queue(){
    let val=[];
    this.push=function(data){
        val.unshift(data);
    }
    this.pop=function(){
        if(val.length==0)
            return null;
        return val.pop();
    }
}

function machine(data) {
    let state=[];
    let initial_state=null;
    let final_state=[];
    let paper="";
    let simulation_start=false;

    let que=[]; 
    this.generate=function(){
        state=data.state;
        let findByName=function(name){
            for(let i=0;i<state.length;i++)
                if(state[i].name==name)
                    return state[i];
            return null;
        }
        for(let i=0;i<state.length;i++){
            if(state[i].isStart)
                initial_state=i;
            if(state[i].isEnd)
                final_state.push(i);
            state[i].transfer=[];
            data.func.forEach(elem=>{
                if(elem.begin_state==state[i].name){
                    let s=elem.text.split("");
                    state[i].transfer.push({
                        to: findByName(elem.end_state),
                        read: s[0],
                        write: s[2],
                        move: s[4]
                    });
                }
            });
        }
    }
    this.check=function() {
        let init_cnt=0;
        let final_cnt=0;
        if(data==null)
            return false;
        data.state.forEach(elem=>{
            if(elem.isStart)
                init_cnt++;
            if(elem.isEnd)
                final_cnt++;
        });
        if(init_cnt>1){
            wx.showToast({
                title: '只能有一个初态',
                icon: 'error',
                duration: 800
            });
            return false;
        }else if(init_cnt==0){
            wx.showToast({
                title: '至少有一个初态',
                icon: 'error',
                duration: 800
            });
            return false;
        }
        if(final_cnt==0){
            wx.showToast({
                title: '至少有一个终态',
                icon: 'error',
                duration: 800
            });
            return false;
        }
        return true;
    }
    this.setpaper=function(str){
        paper=str.split("");
    }
    this.isrunning=function(){
        return simulation_start;
    }
    this.start=function(){
        simulation_start=true;
        // state paper pointer
        que=[[state[initial_state],[...paper],0]];
        state[initial_state].fillcolor="#88c3ff";
    }
    this.stop=function(){
        simulation_start=false;
    }
    this.next=function(){
        let vec=[];
        // remove highlight
        que.forEach(elem=>{
            elem[0].fillcolor="#ffe985";
        });
        que.forEach(elem=>{
            let state=elem[0];
            let p=elem[1];
            state.transfer.forEach(e=>{
                let ptr=elem[2];
                if(ptr>p.length){
                    return;
                }
                if(e.read==p[ptr] || e.read=="ε"){
                    let tmp=[...p];
                    tmp[ptr]=e.write;
                    if(e.move=="L"){
                        ptr--;
                    }else if(e.move=="R"){
                        ptr++;
                    }
                    if(ptr<0){
                        tmp.unshift(null);
                        ptr=0;
                    }else if(ptr>tmp.length){
                        tmp.push(null);
                    }
                    vec.push([e.to,tmp,ptr]);
                }else{
                    return;
                }
            });
        });
        if(vec.length==0){
            wx.showToast({
                title: '运行结束',
                icon: 'none',
                duration: 800
            });
            this.stop();
            return;
        }
        // highlight nodes
        que=vec;
        que.forEach(elem=>{
            elem[0].fillcolor="#88c3ff";
            //console.log(elem[0].name,' ',elem[1],' ',elem[2]);
        });
        //console.log(' ');
    }
    this.result=function(){
        return que;
    }
}

Page({

    /**
     * 页面的初始数据
     */
    data: {
        height:null,
        width:null,
        panel_selected:false,
        result_index:0
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
        ctx.fillStyle="rgb(225,243,216)";
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
        // avoid special situation
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
     * 绘制纸带模拟状态栏
     */
    drawPaper: function() {
        ctx.strokeStyle="#606266";
        let width=this.data.width;
        let acc=width/20;
        if(acc>25)
            acc=25;
        let x=acc;
        let y=simu_panel_pos;

        // draw panel base
        // width: this.data.width-2
        // height: 60
        ctx.beginPath();
        ctx.moveTo(acc,y);
        ctx.lineTo(width-acc,y);
        ctx.quadraticCurveTo(width-1,y,width-1,y+10);
        ctx.lineTo(width-1,y+10);
        ctx.lineTo(width-1,y+50);
        ctx.quadraticCurveTo(width-1,y+60,width-acc,y+60);
        ctx.lineTo(width-acc,y+60);
        ctx.lineTo(acc,y+60);
        ctx.quadraticCurveTo(1,y+60,1,y+50);
        ctx.lineTo(1,y+50);
        ctx.lineTo(1,y+10);
        ctx.quadraticCurveTo(1,y,acc,y);
        ctx.closePath();
        ctx.fillStyle="#f2f6fc";
        ctx.fill();
        ctx.stroke();

        // draw paper
        y+=8;
        ctx.fillStyle="#606266";
        let res_size=instance.result().length;
        let text="Result "+(res_size==0?0:this.data.result_index+1)+"/total "+res_size;
        ctx.fillText(text,3*acc,y);

        y+=8;
        ctx.beginPath();
        ctx.moveTo(acc+2,y);
        ctx.lineTo(acc+2,y-2);
        ctx.lineTo(acc-1,y-2);
        ctx.lineTo(acc-1,y+acc+2);
        ctx.lineTo(acc+2,y+acc+2);
        ctx.closePath();
        ctx.fillStyle="#606266";
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(acc*19-2,y);
        ctx.lineTo(acc*19-2,y-2);
        ctx.lineTo(acc*19+1,y-2);
        ctx.lineTo(acc*19+1,y+acc+2);
        ctx.lineTo(acc*19-2,y+acc+2);
        ctx.closePath();
        ctx.fillStyle="#606266";
        ctx.fill();
        ctx.stroke();

        let result=instance.result();
        if(result.length==0){
            result=[null,[],0];
        }else{
            result=result[this.data.result_index];
        }
        let paper=result[1];
        let ptr=result[2];
        let begin=Math.floor(ptr/18)*18;
        for(let i=begin;i<begin+18;i+=1){
            ctx.beginPath();
            ctx.moveTo(x,y);
            ctx.lineTo(x+acc,y);
            ctx.lineTo(x+acc,y+acc);
            ctx.lineTo(x,y+acc);
            ctx.closePath();
            ctx.fillStyle="rgb(217,236,255)";
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle="#606266";
            if(i<paper.length)
                ctx.fillText(paper[i]!=null?paper[i]:' ',x+acc/2,y+acc/2);
            else
                ctx.fillText(' ',x+acc/2,y+acc/2);
            x+=acc;
        }
        
        // draw arrow which pointing to the place
        // that turing machine is r/w now
        ptr%=18;
        ctx.beginPath();
        ctx.moveTo((1.5+ptr)*acc,y+acc);
        ctx.lineTo((1.8+ptr)*acc,y+1.5*acc);
        ctx.lineTo((1.2+ptr)*acc,y+1.5*acc);
        ctx.closePath();
        ctx.fillStyle="#f56c6c";
        ctx.fill();
        ctx.stroke();
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
        // simulator paper
        this.drawPaper();
    },

    /**
     * 页面加载时加载文件
     */
    loadExistFile: function(filename) {
        try{
            const res=this.fs.readFileSync(`${wx.env.USER_DATA_PATH}/turingmachinesimulator/`+filename,'utf8',0);
            canvasElements=JSON.parse(res);
        }catch(e){ // empty file
            console.error(e);
        }
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.fs=wx.getFileSystemManager();
        if("type" in options && options.type=="fromedit"){
            let pages=getCurrentPages();
            // do deep copy
            let tmp=JSON.stringify(pages[pages.length-2].data.filedata);
            canvasElements=JSON.parse(tmp);
        }else{
            this.loadExistFile(options.filename);
        }
        wx.setNavigationBarTitle({
            title: "模拟器"
        });
        // initialize turing machine
        instance=new machine(canvasElements);
        // initialize canvas context
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
    onReady: function () {
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
        // load default simulator panel's y position
        simu_panel_pos=this.data.height*0.62;
        this.canvasDraw();
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

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
            title:"图灵机验证",
            path:"/pages/simulator/simulator"
        }
    },

    touchStart: function (e) {
        let x=e.touches[0].x;
        let y=e.touches[0].y-30;
        if(simu_panel_pos-30<=y && y<=simu_panel_pos+30){
            this.setData({panel_selected:true});
        }else{
            return;
        }
        if(y<=0)
            y=0;
        if(y>=this.data.height-60-e.target.offsetTop)
            y=this.data.height-60-e.target.offsetTop;
        simu_panel_pos=y;
        this.canvasDraw();
    },

    touchMove: function (e) {
        if(!this.data.panel_selected)
            return;
        let current_x=e.changedTouches[0].x;
        let current_y=e.changedTouches[0].y-30;
        if(current_y<=0)
            current_y=0;
        if(current_y>=this.data.height-60-e.target.offsetTop)
            current_y=this.data.height-60-e.target.offsetTop;
        simu_panel_pos=current_y;
        this.canvasDraw();
    },

    touchEnd: function (e) {
        if(!this.data.panel_selected)
            return;
        let x=e.changedTouches[0].x;
        let y=e.changedTouches[0].y-30;
        if(y<=0)
            y=0;
        if(y>=this.data.height-60-e.target.offsetTop)
            y=this.data.height-60-e.target.offsetTop;
        simu_panel_pos=y;
        this.canvasDraw();
        this.setData({panel_selected:false});
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

    inputString: function() {
        if(instance.isrunning()){
            wx.showToast({
                title: '请中止模拟后再试',
                icon: 'none',
                duration: 800
            });
            return;
        }
        let flush=this.canvasDraw;
        wx.showModal({
            title: "请输入要验证的字符串",
            editable: true,
            success(res){
                if(res.confirm){
                    instance.setpaper(res.content);
                    if(instance.check()){
                        instance.generate();
                        instance.start();
                    }
                    flush();
                }else if(res.cancel){
                    instance.stop();
                }
            }
        });
    },

    nextStep: function() {
        if(!instance.isrunning()){
            wx.showToast({
                title: '模拟器未启动，输入待验证字符串以启动模拟器',
                icon: 'none',
                duration: 1500
            });
            return;
        }
        instance.next();
        this.setData({result_index:0});
        this.canvasDraw();
    },

    terminateSimulation: function() {
        if(!instance.isrunning()){
            wx.showToast({
                title: '模拟器未启动',
                icon: 'none',
                duration: 800
            });
            return;
        }
        wx.showToast({
            title: '运行中止',
            icon: 'none',
            duration: 800
        });
        instance.stop();
        canvasElements.state.forEach(elem=>{
            elem.fillcolor="#ffe985";
        });
        this.setData({result_index:0});
        this.canvasDraw();
    },

    fastRun: function() {
        if(!instance.isrunning()){
            wx.showToast({
                title: '模拟器未启动，输入待验证字符串以启动模拟器',
                icon: 'none',
                duration: 1500
            });
            return;
        }
    },

    nextResult: function() {
        if(!instance.isrunning()){
            wx.showToast({
                title: '模拟器未启动',
                icon: 'none',
                duration: 800
            });
            return;
        }
        let size=this.data.result_index+1;
        if(size>=instance.result().length)
            size=0;
        this.setData({result_index:size});
        this.canvasDraw();
    }
})