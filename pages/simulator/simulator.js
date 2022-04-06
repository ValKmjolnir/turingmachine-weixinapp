// pages/simulator/simulator.js
var canvas=null;
var ctx=null;
const dpr=wx.getSystemInfoSync().pixelRatio;
var canvasElements=null;
var simu_panel_pos=null;

Page({

    /**
     * 页面的初始数据
     */
    data: {
        height:null,
        width:null,
        panel_selected:false
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
        let acc=this.data.width/20;
        if(acc>25)
            acc=25;
        let x=acc;
        let y=simu_panel_pos;

        // draw panel base
        // width: this.data.width-2
        // height: 80
        ctx.beginPath();
        ctx.moveTo(acc,y);
        ctx.lineTo(this.data.width-acc,y);
        ctx.quadraticCurveTo(this.data.width-1,y,this.data.width-1,y+10);
        ctx.lineTo(this.data.width-1,y+10);
        ctx.lineTo(this.data.width-1,y+70);
        ctx.quadraticCurveTo(this.data.width-1,y+80,this.data.width-acc,y+80);
        ctx.lineTo(this.data.width-acc,y+80);
        ctx.lineTo(acc,y+80);
        ctx.quadraticCurveTo(1,y+80,1,y+70);
        ctx.lineTo(1,y+70);
        ctx.lineTo(1,y+10);
        ctx.quadraticCurveTo(1,y,acc,y);
        ctx.closePath();
        ctx.fillStyle="#f2f6fc";
        ctx.fill();
        ctx.stroke();

        // draw paper
        y+=10;
        ctx.beginPath();
        ctx.moveTo(acc+2,y);
        ctx.lineTo(acc+2,y-4);
        ctx.lineTo(acc-1,y-4);
        ctx.lineTo(acc-1,y+acc+4);
        ctx.lineTo(acc+2,y+acc+4);
        ctx.closePath();
        ctx.fillStyle="#606266";
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(acc*19-2,y);
        ctx.lineTo(acc*19-2,y-4);
        ctx.lineTo(acc*19+1,y-4);
        ctx.lineTo(acc*19+1,y+acc+4);
        ctx.lineTo(acc*19-2,y+acc+4);
        ctx.closePath();
        ctx.fillStyle="#606266";
        ctx.fill();
        ctx.stroke();
        for(let i=0;i<18;i+=1){
            ctx.beginPath();
            ctx.moveTo(x,y);
            ctx.lineTo(x+acc,y);
            ctx.lineTo(x+acc,y+acc);
            ctx.lineTo(x,y+acc);
            ctx.closePath();
            x+=acc;
            ctx.fillStyle="rgb(217,236,255)";
            ctx.fill();
            ctx.stroke();
        }
        
        // draw arrow which pointing to the place
        // that turing machine is r/w now
        ctx.beginPath();
        ctx.moveTo(1.5*acc,y+acc);
        ctx.lineTo(1.8*acc,y+1.5*acc);
        ctx.lineTo(1.6*acc,y+1.5*acc);
        ctx.lineTo(1.6*acc,y+2*acc);
        ctx.lineTo(1.4*acc,y+2*acc);
        ctx.lineTo(1.4*acc,y+1.5*acc);
        ctx.lineTo(1.2*acc,y+1.5*acc);
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
            canvasElements=pages[pages.length-2].data.filedata;
        }else{
            this.loadExistFile(options.filename);
        }
        wx.setNavigationBarTitle({
            title: "模拟器"
        });
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
        let y=e.touches[0].y-40;
        if(simu_panel_pos-40<=y && y<=simu_panel_pos+40){
            this.setData({panel_selected:true});
        }else{
            return;
        }
        if(y<=0)
            y=0;
        if(y>=this.data.height-80)
            y=this.data.height-80;
        simu_panel_pos=y;
        this.canvasDraw();
    },

    touchMove: function (e) {
        if(!this.data.panel_selected)
            return;
        let current_x=e.changedTouches[0].x;
        let current_y=e.changedTouches[0].y-40;
        if(current_y<=0)
            current_y=0;
        if(current_y>=this.data.height-80)
            current_y=this.data.height-80;
        simu_panel_pos=current_y;
        this.canvasDraw();
    },

    touchEnd: function (e) {
        if(!this.data.panel_selected)
            return;
        let x=e.changedTouches[0].x;
        let y=e.changedTouches[0].y-40;
        if(y<=0)
            y=0;
        if(y>=this.data.height-80)
            y=this.data.height-80;
        simu_panel_pos=y;
        this.canvasDraw();
        this.setData({panel_selected:false});
    }
})