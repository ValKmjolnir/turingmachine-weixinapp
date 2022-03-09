// pages/edit.js
var begin_x,begin_y,end_x,end_y;
var canvas=null;
var ctx=null;
const dpr=wx.getSystemInfoSync().pixelRatio;

Page({

    /**
     * 页面的初始数据
     */
    data: {
        type:null,
        filename:"untitled.json",
        operand_type:"select",
        successSaveFile:false,
        cancelSaveFile:false,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        let t=options.type;
        this.setData({
            type:t
        });
        if("filename" in options)
            this.setData({
                filename:options.filename
            });
        wx.setNavigationBarTitle({
          title: this.data.filename,
        })
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
        if(this.data.successSaveFile)
            wx.showToast({
                title: '创建成功',
                icon: 'success',
                duration: 1000
            });
        else if(this.data.cancelSaveFile)
            wx.showToast({
                title: '取消创建',
                icon: 'error',
                duration: 1000
            });
        this.setData({
            successSaveFile:false,
            cancelSaveFile:false
        });
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

    tapButton: function (e) {
        var opr=e.currentTarget.dataset.param;
        this.setData({
            operand_type: opr
        });
    },

    saveFile: function(e) {
        if(this.data.filename=="untitled.json")
            wx.navigateTo({
                url: '/pages/savefile/savefile?type='+this.data.type,
            });
        return;
    },

    drawCircle: function (e) {
        if(this.data.operand_type!="state")
            return;
        var x=e.detail.x-e.target.offsetLeft;
        var y=e.detail.y-e.target.offsetTop;

        ctx.beginPath();
        ctx.arc(x,y,10,0,2*Math.PI);
        ctx.fillStyle="#ffe985";
        ctx.fill();
        ctx.stroke();
    },

    drawLine: function(e) {
        if(this.data.operand_type!="func")
            return;
        end_x=e.changedTouches[0].x;
        end_y=e.changedTouches[0].y;

        ctx.beginPath();
        ctx.moveTo(begin_x,begin_y);
        ctx.lineTo(end_x,end_y);
        ctx.stroke();
    },

    touchStart: function(e) {
        begin_x=e.touches[0].x;
        begin_y=e.touches[0].y;
    },

    touchEnd: function(e) {
        if(this.data.operand_type!="func")
            return;
        end_x=e.changedTouches[0].x;
        end_y=e.changedTouches[0].y;

        ctx.beginPath();
        ctx.moveTo(begin_x,begin_y);
        ctx.lineTo(end_x,end_y);
        ctx.stroke();
    }
})