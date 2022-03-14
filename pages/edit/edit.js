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

class machine_state{

}

class transfer_equation{

}

Page({

    /**
     * 页面的初始数据
     */
    data: {
        filename:"untitled.json",
        filedata:{},
        operand_type:"select",
        successSaveFile:false,
        cancelSaveFile:false,
    },

    canvasDraw: function() {
        if(ctx==undefined)
            return;
        let state=canvasElements.state;
        let func=canvasElements.func;

        // global text setting
        ctx.font="10rpx sans-serif"
        ctx.textAlign="center";
        ctx.textBaseline="middle";
        // background
        ctx.fillStyle="#edf8fc";
        ctx.fillRect(0,0,canvas.width,canvas.height);
        // states
        state.forEach(elem => {
            ctx.beginPath();
            ctx.arc(elem.x,elem.y,15,0,2*Math.PI);
            ctx.fillStyle="#ffe985";
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle="#000000";
            ctx.fillText(elem.name,elem.x,elem.y);
        });
        // functions
        func.forEach(elem =>{
            ctx.beginPath();
            if(elem.begin_x==elem.end_x && elem.begin_y==elem.end_y){
                ctx.arc(elem.begin_x,elem.begin_y,10,0,1.5*Math.PI);
                ctx.stroke();
            }else{
                ctx.moveTo(elem.begin_x,elem.begin_y);
                ctx.lineTo(elem.end_x,elem.end_y);
                ctx.stroke();
            }
        });
    },

    loadExistFile: function(filename) {
        try{
            const res=this.fs.readFileSync(`${wx.env.USER_DATA_PATH}/turingmachinesimulator/`+filename,'utf8',0);
            canvasElements=JSON.parse(res);
            state_counter=canvasElements.state.length;
        }catch(e){
            console.error(e);
        }
    },

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
                // background fill color
                ctx.fillStyle="#edf8fc";
                ctx.fillRect(0,0,canvas.width,canvas.height);
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
            operand_type: e.currentTarget.dataset.param
        });
    },

    /**
     * 保存模型到文件
     */
    saveFile: function(e) {
        let name=this.data.filename;
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
            name:"q"+String(state_counter)
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
            end_y:y
        });
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
        }else if(opr=="func"){
            this.tapFunc(x,y);
        }else if(opr=="select"){
            ;
        }
        this.canvasDraw();
    },

    /**
     * canvas点击移动事件
     */
    touchMove: function(e) {
        if(this.data.operand_type!="func")
            return;
        let end_x=e.changedTouches[0].x;
        let end_y=e.changedTouches[0].y;
        let vec=canvasElements.func;
        let index=vec.length-1;
        vec[index].end_x=end_x;
        vec[index].end_y=end_y;
        this.canvasDraw();
    },

    /**
     * canvas点击移动开始
     */
    touchStart: function(e) {
        if(this.data.operand_type!="func")
            return;
        let begin_x=e.touches[0].x;
        let begin_y=e.touches[0].y;
        canvasElements.func.push({
            begin_x:begin_x,
            begin_y:begin_y,
            end_x:begin_x,
            end_y:begin_y
        });
    },

    /**
     * canvas点击移动结束
     */
    touchEnd: function(e) {
        if(this.data.operand_type!="func")
            return;
        let end_x=e.changedTouches[0].x;
        let end_y=e.changedTouches[0].y;
        let vec=canvasElements.func;
        let index=vec.length-1;
        vec[index].end_x=end_x;
        vec[index].end_y=end_y;
        this.canvasDraw();
    }
})