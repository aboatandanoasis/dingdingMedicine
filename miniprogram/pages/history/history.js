// 服药历史记录页面
Page({
  data: {
    records: [],
    groupedRecords: [],
    loading: true
  },

  onLoad() {
    this.loadHistory()
  },

  onShow() {
    this.loadHistory()
  },

  // 加载历史记录
  async loadHistory() {
    this.setData({ loading: true })
    
    try {
      const db = wx.cloud.database()
      const res = await db.collection('medicine_records')
        .orderBy('takeTime', 'desc')
        .limit(100)
        .get()
      
      // 按日期分组
      const grouped = this.groupByDate(res.data)
      
      this.setData({ 
        records: res.data,
        groupedRecords: grouped,
        loading: false
      })
    } catch (err) {
      console.error('加载历史记录失败:', err)
      this.setData({ loading: false })
      
      // 如果是集合不存在，提示用户
      if (err.errMsg && err.errMsg.includes('collection')) {
        wx.showToast({
          title: '暂无历史记录',
          icon: 'none'
        })
      }
    }
  },

  // 按日期分组
  groupByDate(records) {
    const groups = {}
    
    records.forEach(record => {
      const date = this.formatDate(record.takeTime)
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(record)
    })
    
    // 转换为数组
    return Object.keys(groups).map(date => ({
      date,
      records: groups[date]
    }))
  },

  // 格式化日期
  formatDate(timestamp) {
    const date = new Date(timestamp)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekDay = weekDays[date.getDay()]
    
    return `${month}月${day}日 ${weekDay}`
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp)
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${hour}:${minute}`
  },

  // 返回首页
  goBack() {
    wx.navigateBack()
  },

  // 清空历史记录
  async clearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有历史记录吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const db = wx.cloud.database()
            // 批量删除
            const records = this.data.records
            for (let record of records) {
              await db.collection('medicine_records').doc(record._id).remove()
            }
            
            this.setData({ 
              records: [],
              groupedRecords: []
            })
            
            wx.showToast({
              title: '已清空',
              icon: 'success'
            })
          } catch (err) {
            console.error('清空失败:', err)
            wx.showToast({
              title: '清空失败',
              icon: 'none'
            })
          }
        }
      }
    })
  }
})
