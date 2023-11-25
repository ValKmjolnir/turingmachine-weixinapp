// pages/auth/auth.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        info:"权限设置"
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        if("info" in options)
            this.setData({info:options.info})
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
            title: "权限设置",
            path: "/pages/auth/auth"
        }
    },

    settingNavigateBack: function() {
        wx.navigateBack({
            delta: 0,
        });
    }
})