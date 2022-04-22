// pages/index/index.js
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
        let fs=wx.getFileSystemManager();
        fs.access({
            path: `${wx.env.USER_DATA_PATH}/turingmachinesimulator`,
            fail(res){
                fs.mkdir({
                    dirPath: `${wx.env.USER_DATA_PATH}/turingmachinesimulator`,
                    recursive: false
                });
            }
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
            title:"首页",
            path:"/pages/index/index"
        }
    },

    gotoedit: function(param) {
        let arg=param.currentTarget.dataset.param;
        if(arg=="multiple"){
            let tape=2;
            wx.showModal({
                title:"输入纸带数(2~5)",
                editable:true,
                placeholderText:"2",
                success(res){
                    if(res.confirm){
                        if(res.content.length)
                            tape=Number(res.content);
                        if(isNaN(tape) || (2<=tape && tape<=5)){
                            wx.navigateTo({
                                url: "/pages/edit/edit?type=multiple&tapes="+tape,
                            });
                        }
                    }
                }
            });
        }
        if(arg=="normal" || arg=="subprogram"){
            wx.navigateTo({
                url: "/pages/edit/edit?type="+arg,
            });
        }
    },

    gotofiles: function (param) {
        wx.navigateTo({
          url: '/pages/files/files',
        });
    }
});