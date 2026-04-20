// 云开发初始化
wx.cloud.init({
  env: '',
//填写自己的微信云开发环境ID
  traceUser: true
})

App({
  onLaunch: function () {
    // 检查云开发能力
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    }
  }
})
