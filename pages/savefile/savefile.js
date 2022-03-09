// pages/savefile/savefile.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        type:null,
        filename:"untitled"
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.setData({
            type:options.type
        });
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

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
            title:"保存文件",
            path:"/pages/savefile/savefile"
        }
    },

    confirmSave: function() {
        if(this.data.filename=="untitled"){
            wx.showToast({
              title: '文件名不能为空',
              icon: 'error',
              duration: 1000
            });
            return;
        }
        wx.navigateBack({
            delta: 0,
        });
    },

    cancelSave: function() {
        wx.navigateBack({
          delta: 0,
        })
    }
})