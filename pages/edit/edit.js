// pages/edit.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        type:null,
        filename:"untitled.json",
        operand_type:"select",
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
            })
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {
        wx.createSelectorQuery()
            .select('#canvas')
            .fields({node:true,size:true})
            .exec((res)=>{
                const canvas=res[0].node;
                const ctx=canvas.getContext('2d');

                const dpr=wx.getSystemInfoSync().pixelRatio;
                canvas.width=res[0].width*dpr;
                canvas.height=res[0].height*dpr;
                ctx.scale(dpr,dpr);
                
                // background fill color
                ctx.fillStyle="#edf8fc";
                ctx.fillRect(0,0,canvas.width,canvas.height);
            });
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

    },

    tapButton: function (e) {
        var opr=e.currentTarget.dataset.param;
        this.setData({
            operand_type: opr
        });
    },

    saveFile: function(e) {

    },

    drawCircle: function (e) {
        var x=e.detail.x-e.target.offsetLeft;
        var y=e.detail.y-e.target.offsetTop;
        wx.createSelectorQuery()
            .select("#canvas")
            .fields({node:true,size:true})
            .exec((res)=>{
                const canvas=res[0].node;
                const ctx=canvas.getContext('2d');
                
                const dpr=wx.getSystemInfoSync().pixelRatio;
                ctx.beginPath();
                ctx.arc(x,y,10,0,2*Math.PI);
                ctx.fillStyle="#ffe985";
                ctx.fill();
                ctx.stroke();
            });
    }
})