// pages/edit.js
var canvas=null;
var ctx=null;
const dpr=wx.getSystemInfoSync().pixelRatio;
var state_counter=0;
var canvasElements={
    type:null,
    state:[],
    func:[],
};

Page({
    /**
     * 页面的初始数据
     */
    data: {
        point:{
            isLongTap:false,
            startx:0,
            starty:0
        },
        selectedState:null,
        touchStartTime:0,
        touchEndTime:0,
        filename:"untitled.json",
        filedata:{},
        operand_type:"select",
        successSaveFile:false,
        cancelSaveFile:false,
    },

    /**
     * 寻找距离点击处最近的状态
     */
    findNearestState: function(x,y) {
        let dis=1e6;
        let tmp_state={};
        canvasElements.state.forEach(elem => {
            elem.fillcolor="#ffe985";
            let t=Math.sqrt(Math.pow(x-elem.x,2)+Math.pow(y-elem.y,2));
            if(t<=dis){
                tmp_state=elem;
                dis=t;
            }
        });
        if(dis<=15){
            tmp_state.fillcolor="#8db7ee";
            return tmp_state;
        }
        return null;
    },

    /** 
     * 初始化文字格式 
     */
    stateTextStyle: function() {
        ctx.font="10rpx sans-serif"
        ctx.textAlign="center";
        ctx.textBaseline="middle";
    },

    /**
     * 绘制状态
     */
    drawState: function(name,x,y,r,color) {
        // draw circle
        ctx.beginPath();
        ctx.arc(x,y,r,0,2*Math.PI);
        ctx.fillStyle=color;
        ctx.fill();
        ctx.stroke();
        // set text
        ctx.fillStyle="#000000";
        ctx.fillText(name,x,y);
    },

    /**
     * 绘制初态侧面三角形
     */
    drawStateStart: function(x,y,r) {
        ctx.beginPath();
        ctx.moveTo(x-r,y);
        ctx.lineTo(x-r-0.5*r,y-0.7*r);
        ctx.lineTo(x-r-0.5*r,y+0.7*r);
        ctx.lineTo(x-r,y);
        ctx.fillStyle="#a0ebde";
        ctx.fill();
        ctx.stroke();
    },

    /**
     * 绘制终态的小圆环
     */
    drawStateEnd: function(x,y,r) {
        ctx.beginPath();
        ctx.arc(x,y,r,0,2*Math.PI);
        ctx.stroke();
    },

    /**
     * 绘制选择圆环
     */
    drawCircleSelect: function(x,y,r) {
        let nr=1.5;  // text offset
        ctx.beginPath();
        ctx.arc(x,y,2.5*r,0,2*Math.PI);
        ctx.stroke();
        // set text
        ctx.fillStyle="#000000";
        ctx.fillText("初",x-nr*r,y-r);
        ctx.fillText("态",x-nr*r,y+r);
        ctx.fillText("终",x+nr*r,y-r);
        ctx.fillText("态",x+nr*r,y+r);
    },

    /**
     * 绘制直线箭头
     */
    drawArrow: function(bx,by,ex,ey) {
        let angle=Math.atan2(ey-by,ex-bx)/Math.PI*180;

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
    },

    /**
     * 绘制指向自己的箭头
     */
    drawSelfArrow: function(x,y) {

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
    },

    /**
     * canvas绘制刷新主函数
     */
    canvasDraw: function() {
        if(ctx==undefined)
            return;
        // background
        ctx.fillStyle="#edf8fc";
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.fillRect(0,0,canvas.width,canvas.height);

        // states
        this.stateTextStyle(); // init state text style
        canvasElements.state.forEach(elem=>{
            this.drawState(elem.name,elem.x,elem.y,15,elem.fillcolor);
            if(elem.isEnd)
                this.drawStateEnd(elem.x,elem.y,11);
            if(elem.isStart)
                this.drawStateStart(elem.x,elem.y,15);
        });
        // functions
        ctx.fillStyle="#000000"; // init fill style
        canvasElements.func.forEach(elem =>{
            if(elem.begin_x==elem.end_x && elem.begin_y==elem.end_y){
                this.drawSelfArrow(elem.begin_x,elem.begin_y);
            }else{
                this.drawArrow(elem.begin_x,elem.begin_y,elem.end_x,elem.end_y);
            }
        });
    },

    /**
     * 页面加载时加载文件
     * 在有文件的时候用JSON初始化组件列表
     */
    loadExistFile: function(filename) {
        try{
            const res=this.fs.readFileSync(`${wx.env.USER_DATA_PATH}/turingmachinesimulator/`+filename,'utf8',0);
            canvasElements=JSON.parse(res);
            state_counter=canvasElements.state.length;
        }catch(e){
            // empty file
            console.error(e);
        }
    },

    /**
     * 页面加载时加载文件
     * 在没有文件时初始化组件列表
     */
    createTemporaryFile: function(type) {
        state_counter=0; // set state name counter to 0
        canvasElements.type=type; // get type of automata
        canvasElements.state=[];
        canvasElements.func=[];
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
        canvasElements.state.forEach(elem =>{
            elem.fillcolor="#ffe985";
        });
        this.setData({
            filedata:canvasElements
        });
        if(name=="untitled.json"){
            wx.navigateTo({
                url: '/pages/savefile/savefile?type='+canvasElements.type,
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
     * 单次点击创建新状态
     */
    tapState: function(x,y){
        canvasElements.state.push({
            x:x,
            y:y,
            name:"q"+String(state_counter),
            fillcolor:"#ffe985",
            isStart:0,
            isEnd:0
        });
        state_counter+=1;
    },

    /**
     * 单次点击创建新的转移函数
     */
    tapFunc: function(x,y){
        canvasElements.func.push({
            begin_x:x,
            begin_y:y,
            end_x:x,
            end_y:y,
            begin_state:null,
            end_state:null
        });
    },

    /**
     * select下长按状态
     */
    tapLongTouch: function(x,y){
        let tmp_state=this.findNearestState(x,y);
        if(tmp_state!=null){
            this.setData({point:{isLongTap:true,startx:tmp_state.x,starty:tmp_state.y}});
            this.drawCircleSelect(tmp_state.x,tmp_state.y,15);
        }
    },

    /**
     * select下长按状态的选择
     */
    tapLongTouchSelect: function(x,y){
        let start_x=this.data.point.startx;
        let start_y=this.data.point.starty;
        if(Math.pow((x-start_x),2)+Math.pow((y-start_y),2)>15*15){
            canvasElements.state.forEach(elem =>{
                let t=Math.sqrt(Math.pow(start_x-elem.x,2)+Math.pow(start_y-elem.y,2));
                if(t<=15){
                    if(x<start_x){
                        elem.isStart=1-elem.isStart;
                    }else{
                        elem.isEnd=1-elem.isEnd;
                    }
                    this.canvasDraw();
                }
            });
        }
    },

    /** 
     * canvas单次点击事件
     */
    tapFunction: function (e) {
        let x=e.detail.x-e.target.offsetLeft;
        let y=e.detail.y-e.target.offsetTop;
        let opr=this.data.operand_type;
        if(opr=="state"){
            this.tapState(x,y);
        }else if(opr=="select"){
            this.findNearestState(x,y);
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
        if(opr=="select" && this.data.point.isLongTap==false && this.data.selectedState!=null){
            let tmp_state=this.data.selectedState;
            tmp_state.x=current_x;
            tmp_state.y=current_y;
            this.canvasDraw();
        }else if(opr=="func"){
            let vec=canvasElements.func;
            let index=vec.length-1;
            vec[index].end_x=current_x;
            vec[index].end_y=current_y;
            this.canvasDraw();
        }
    },

    /**
     * canvas点击移动开始
     */
    touchStart: function(e) {
        let begin_x=e.touches[0].x;
        let begin_y=e.touches[0].y;
        let opr=this.data.operand_type;
        if(opr=="select"){
            this.setData({
                touchStartTime:e.timeStamp,
                point:{
                    isLongTap:false,
                    startx:begin_x,
                    starty:begin_y
                },
                selectedState:this.findNearestState(begin_x,begin_y)
            });
        }else if(opr=="func"){
            canvasElements.func.push({
                begin_x:begin_x,
                begin_y:begin_y,
                end_x:begin_x,
                end_y:begin_y
            });
        }
    },

    /**
     * canvas点击移动结束
     */
    touchEnd: function(e) {
        let end_x=e.changedTouches[0].x;
        let end_y=e.changedTouches[0].y;
        this.setData({
            touchEndTime:e.timeStamp,
            selectedState:null
        });
        if(this.data.point.isLongTap){
            this.tapLongTouchSelect(end_x,end_y);
        }else{
            if(this.data.operand_type!="func")
                return;
            let vec=canvasElements.func;
            let index=vec.length-1;
            vec[index].end_x=end_x;
            vec[index].end_y=end_y;
            this.canvasDraw();
        }
        this.setData({point:{isLongTap:false}});
    },

    /**
     * canvas长按事件 
     */
    longTap: function(e) {
        let x=e.touches[0].x;
        let y=e.touches[0].y;
        let opr=this.data.operand_type;
        if(opr=="select" && e.timeStamp-this.data.touchStartTime>1){
            this.setData({point:{isLongTap:true}});
            this.tapLongTouch(x,y);
        }
    }
})