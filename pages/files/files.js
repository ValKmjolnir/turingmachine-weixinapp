// pages/files/files.js

Page({

    /**
     * 页面的初始数据
     */
    data: {
        files:[],
        empty_file_list:true,
        navigateType:""
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.setData({navigateType:options.nav});
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
        if(this.data.files.length>0)
            this.setData({
                empty_file_list:false
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
            title:"文件列表",
            path:"/pages/files/files"
        }
    },

    /**
     * nav="select"时使用该函数，选择文件跳转到编辑界面
    */
    gotoedit: function(param) {
        let arg=param.currentTarget.dataset.param;
        wx.navigateTo({
            url: "/pages/edit/edit?type=exist_file&filename="+arg,
        });
    },

    /**
     * nav="module"时使用该函数，选择文件作为子程序
     * 只在子程序图灵机编辑界面会使用
    */
    gobackedit: function(param) {
        const fs=this.fs;
        const arg=param.currentTarget.dataset.param;
        let type="";
        try{
            const r=fs.readFileSync(
                `${wx.env.USER_DATA_PATH}/turingmachinesimulator/`+arg,
                'utf8',0);
            type=JSON.parse(r).type;
        }catch(e){ // empty file
            wx.showToast({title: '读取失败',icon: "none",duration: 800});
            return;
        }
        if(type!="normal"){
            wx.showToast({
                title: "子程序必须是单带图灵机",
                icon: "none",
                duration: 1500
            });
            return;
        }
        const event=this.getOpenerEventChannel();
        event.emit("getFile",arg);
        wx.navigateBack({delta:0});
    },

    clearfile: function(param) {
        let fs=this.fs;
        let name=param.currentTarget.dataset.param;
        wx.showModal({
            title:"清空文件",
            content:"是否清空并初始化文件内容？",
            success (res) {
                if(res.confirm){
                    let init=null;
                    try{
                        const res=fs.readFileSync(`${wx.env.USER_DATA_PATH}/turingmachinesimulator/`+name,'utf8',0);
                        init=JSON.parse(res);
                    }catch(e){ // empty file
                        console.error(e);
                    }
                    init.state_counter=0;
                    init.state=[];
                    init.func=[];
                    try{
                        fs.writeFileSync(
                            `${wx.env.USER_DATA_PATH}/turingmachinesimulator/`+name,
                            JSON.stringify(init),
                            'utf8');
                    }catch(e){
                        console.error(e);
                    }
                }
            }
        });
    }
})