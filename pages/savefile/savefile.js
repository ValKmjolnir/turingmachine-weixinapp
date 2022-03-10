// pages/savefile/savefile.js

function newJsonStringify(type){
    let h={
        type:type,
        state:[],
        func:[]
    };
    return JSON.stringify(h);
}

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

    inputFilename: function(e) {
        this.setData({
            filename:e.detail.value
        });
    },

    confirmSave: function() {
        let type=this.data.type;
        let fname=this.data.filename;
        let fs=this.fs;
        if(fname=="untitled" || fname==""){
            wx.showToast({
                title: '文件名不能为空',
                icon: 'error',
                duration: 1000
            });
            return;
        }else if(fname.indexOf("/")>=0 || fname.indexOf(".")>=0){
            wx.showToast({
                title: '非法文件名',
                icon: 'error',
                duration: 1000
            });
            return;
        }
        try{
            let fd=fs.openSync({
                filePath: `${wx.env.USER_DATA_PATH}/turingmachinesimulator/${fname}.json`,
                flag: "wx"
            });
            console.log(fd);
            fs.writeSync({
                fd:fd,
                data:newJsonStringify(type)
            });
            let pages=getCurrentPages();
            pages[pages.length-2].setData({
                successSaveFile:true,
                filename:fname+".json",
            });
            wx.navigateBack({
              delta: 0,
            })
        }catch(ex){
            wx.showToast({
                title: '文件名已存在',
                icon: 'error',
                duration: 1000
            });
        }
    },

    cancelSave: function() {
        let pages=getCurrentPages();
        pages[pages.length-2].setData({
            cancelSaveFile:true
        });
        wx.navigateBack({
          delta: 0,
        })
    }
})