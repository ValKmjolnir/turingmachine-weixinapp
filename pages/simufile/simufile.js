// pages/simufile/simufile.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        files:[]
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.fs=wx.getFileSystemManager();
        wx.setNavigationBarTitle({
            title: 'Choose Turing Machine File',
        })
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
        let fs=this.fs;
        let list=fs.readdirSync(`${wx.env.USER_DATA_PATH}/turingmachinesimulator`);
        for(let i=0;i<list.length;i++){
            // sometimes a file is deleted but still readable by readdir
            // but it is not accessable
            try{
                fs.accessSync(`${wx.env.USER_DATA_PATH}/turingmachinesimulator/`+list[i]);
            }catch(e){
                list.splice(i,1);
                i--;
            }
        }
        this.setData({files:list});
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
            title:"模拟器",
            path:"/pages/simufile/simufile"
        }
    },

    gotoSimulator: function(param) {
        let arg=param.currentTarget.dataset.param;
        wx.navigateTo({
            url: "/pages/simulator/simulator?filename="+arg,
        });
    }
})