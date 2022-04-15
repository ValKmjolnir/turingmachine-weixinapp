// pages/settings/settings.js
Page({

    /**
     * 页面的初始数据
     */
    data: {

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        wx.setNavigationBarTitle({
            title: '设置',
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
            title:"自动机设置",
            path:"/pages/settings/settings"
        }
    },

    /**
     * 编辑功能教程提示
     */
    tapTips: function(param) {
        const tips={
            select: "选择组件",
            state: "创建状态",
            transfer: "创建状态转移函数",
            delete: "删除",
            undo: "撤回",
            rollback: "取消撤回",
            savefile: "保存文件",
            savepic: "保存为图片",
            simulation: "跳转到模拟器",
            input: "输入待验证字符串",
            next: "单步执行",
            terminate: "中止模拟",
            fastrun: "快速执行(直接得到结果)",
            prevresult: "展示上个结果",
            nextresult: "展示下个结果"
        };
        wx.showToast({
          title: tips[param.currentTarget.dataset.param],
          icon: "none",
          duration: 1000
        })
    },

    setClipboard: function() {
        wx.setClipboardData({
            data: "ε",
            success(res){
                wx.showToast({
                    title: "复制成功",
                    icon: "none",
                    duration: 800
                });
            }
        });
    }
})