// pages/files/files.js

Page({

    /**
     * 页面的初始数据
     */
    data: {
        files:['a','b','c']
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.fs=wx.getFileSystemManager();
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
        this.setData({
            files:fs.readdirSync(`${wx.env.USER_DATA_PATH}/turingmachinesimulator`)
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

    },

    upload: function () {
        wx.chooseImage({
          count: 1,
          success(res){
              const tmp=res.tempFilePaths;
              wx.saveFile({
                tempFilePath: tmp[0],
                success(res){
                    const savedFilePath=res.savedFilePath;
                    console.log(savedFilePath);
                }
              })
          }
        });
    },

    readfile: function() {
        wx.getSavedFileList({
            success: (res) => {
                res.fileList.forEach(element => {
                    console.log(element.filePath);
                });
            }
        })
    }
})