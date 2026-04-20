// 老人端主页逻辑 - 极简大字版（含历史记录功能）
const app = getApp()

Page({
  data: {
    currentDate: '',
    greeting: '',
    medicines: [],
    allTaken: false,
    showDialog: false,
    showEditDialog: false,
    newDrug: {
      name: '',
      description: '',
      dosage: '',
      unit: '片',
      image: '',
      tempId: null
    },
    editDrug: {
      id: null,
      name: '',
      description: '',
      dosage: '',
      unit: '片',
      unitIndex: 0,
      image: ''
    },
    units: ['片', '粒', '颗', '包', '毫升'],
    unitIndex: 0,
    // 触摸相关
    startX: 0,
    currentId: null
  },

  onLoad() {
    this.initDate()
    this.loadMedicines()
  },

  // 初始化日期
  initDate() {
    const now = new Date()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekDay = weekDays[now.getDay()]
    const hour = now.getHours()
    
    // 根据时间设置问候语（凌晨3点前算晚上）
    let greeting = '早上好'
    if (hour >= 3 && hour < 12) {
      greeting = '早上好'
    } else if (hour >= 12 && hour < 18) {
      greeting = '中午好'
    } else {
      // 18:00 - 次日2:59 都算晚上
      greeting = '晚上好'
    }
    
    this.setData({
      currentDate: `${month}月${day}日 ${weekDay}`,
      greeting: `${greeting}，记得吃药`
    })
  },

  // 加载药品数据
  loadMedicines() {
    const medicines = [
      {
        id: 1,
        name: '降压药',
        description: '白色圆形',
        dosage: '1',
        unit: '片',
        taken: false,
        status: 'pending',
        image: '',
        translateX: 0
      },
      {
        id: 2,
        name: '降糖药',
        description: '蓝色椭圆',
        dosage: '1',
        unit: '片',
        taken: true,
        status: 'done',
        image: '',
        translateX: 0
      },
      {
        id: 3,
        name: '钙片',
        description: '橙色圆形',
        dosage: '2',
        unit: '片',
        taken: false,
        status: 'overdue',
        image: '',
        translateX: 0
      }
    ]
    this.setData({ medicines })
    this.checkAllTaken()
  },

  // ========== 图片相关 ==========
  
  onImageTap(e) {
    const { id, image } = e.currentTarget.dataset
    
    if (image) {
      wx.previewImage({
        current: image,
        urls: [image]
      })
    } else {
      this.chooseAndUploadImage(id)
    }
  },

  chooseAndUploadImage(medicineId) {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        wx.showLoading({ title: '上传中...' })
        
        const cloudPath = `medicine-images/${medicineId}-${Date.now()}.jpg`
        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: tempFilePath,
          success: (uploadRes) => {
            wx.hideLoading()
            const medicines = this.data.medicines.map(item => {
              if (item.id === medicineId) {
                item.image = uploadRes.fileID
              }
              return item
            })
            this.setData({ medicines })
            wx.showToast({ title: '上传成功', icon: 'success' })
          },
          fail: (err) => {
            wx.hideLoading()
            const medicines = this.data.medicines.map(item => {
              if (item.id === medicineId) {
                item.image = tempFilePath
              }
              return item
            })
            this.setData({ medicines })
            wx.showToast({ title: '已保存到本地', icon: 'none' })
          }
        })
      }
    })
  },

  // ========== 触摸滑动相关 ==========
  
  onTouchStart(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ startX: e.touches[0].clientX, currentId: id })
  },

  onTouchMove(e) {
    const id = e.currentTarget.dataset.id
    const startX = this.data.startX
    const currentX = e.touches[0].clientX
    const diffX = currentX - startX
    
    const medicines = this.data.medicines.map(item => {
      if (item.id === id) {
        if (diffX < 0) {
          item.translateX = Math.max(diffX, -70)
        } else {
          item.translateX = 0
        }
      } else {
        item.translateX = 0
      }
      return item
    })
    this.setData({ medicines })
  },

  onTouchEnd(e) {
    const id = e.currentTarget.dataset.id
    const medicines = this.data.medicines.map(item => {
      if (item.id === id) {
        if (item.translateX < -35) {
          item.translateX = -70
        } else {
          item.translateX = 0
        }
      }
      return item
    })
    this.setData({ medicines })
  },

  // ========== 长按操作 ==========
  
  onLongPressAction(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.medicines.find(m => m.id === id)
    
    wx.showActionSheet({
      itemList: ['编辑', '删除'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.showEditDialog(id)
        } else if (res.tapIndex === 1) {
          wx.showModal({
            title: '删除药物',
            content: `确定要删除"${item.name}"吗？`,
            confirmColor: '#f44336',
            success: (modalRes) => {
              if (modalRes.confirm) {
                this.deleteMedicineById(id)
              }
            }
          })
        }
      }
    })
  },

  onDeleteMedicine(e) {
    const id = e.currentTarget.dataset.id
    this.deleteMedicineById(id)
  },

  deleteMedicineById(id) {
    const medicines = this.data.medicines.filter(item => item.id !== id)
    this.setData({ medicines })
    this.checkAllTaken()
    
    wx.showToast({
      title: '已删除',
      icon: 'success',
      duration: 1500
    })
  },

  // ========== 状态切换 ==========
  
  onStatusTap(e) {
    const id = e.currentTarget.dataset.id
    
    wx.showActionSheet({
      itemList: ['✓ 已吃', '○ 未到时间', '✗ 过时未吃'],
      success: (res) => {
        const statusOptions = ['done', 'pending', 'overdue']
        const newStatus = statusOptions[res.tapIndex]
        
        const medicines = this.data.medicines.map(m => {
          if (m.id === id) {
            m.status = newStatus
            m.taken = (newStatus === 'done')
          }
          return m
        })
        
        this.setData({ medicines })
        this.checkAllTaken()
      }
    })
  },

  // ========== 一键确认（含保存历史记录）==========
  
  async confirmAllTaken() {
    if (this.data.allTaken) return
    
    const medicines = this.data.medicines.map(item => ({
      ...item,
      taken: true,
      status: 'done',
      translateX: 0
    }))
    
    this.setData({ 
      medicines, 
      allTaken: true 
    })
    
    // 保存服药记录到云数据库
    await this.saveMedicineRecords()
    
    wx.showToast({
      title: '已记录',
      icon: 'success',
      duration: 2000
    })
  },

  // 保存服药记录到云数据库
  async saveMedicineRecords() {
    try {
      const db = wx.cloud.database()
      const now = Date.now()
      
      // 为每种药物保存一条记录
      for (let medicine of this.data.medicines) {
        await db.collection('medicine_records').add({
          data: {
            medicineId: medicine.id,
            medicineName: medicine.name,
            dosage: medicine.dosage || '',
            unit: medicine.unit || '片',
            description: medicine.description || '',
            image: medicine.image || '',
            takeTime: now,
            takeTimeStr: this.formatTime(now)
          }
        })
      }
      console.log('服药记录保存成功')
    } catch (err) {
      console.error('保存服药记录失败:', err)
    }
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp)
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${hour}:${minute}`
  },

  checkAllTaken() {
    const allTaken = this.data.medicines.length > 0 && 
                     this.data.medicines.every(item => item.taken)
    this.setData({ allTaken })
  },

  // 跳转到历史记录页面
  goToHistory() {
    wx.navigateTo({
      url: '/pages/history/history'
    })
  },

  // ========== 添加弹窗 ==========
  
  showAddDialog() {
    const tempId = Date.now()
    this.setData({
      showDialog: true,
      newDrug: {
        name: '',
        description: '',
        dosage: '',
        unit: '片',
        image: '',
        tempId: tempId
      },
      unitIndex: 0
    })
  },

  hideDialog() {
    this.setData({ showDialog: false })
  },

  preventBubble() {},
  
  onAddImageTap() {
    const tempId = this.data.newDrug.tempId || Date.now()
    
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.setData({ 'newDrug.image': tempFilePath })
      }
    })
  },

  onNameInput(e) {
    this.setData({ 'newDrug.name': e.detail.value })
  },

  onDescInput(e) {
    this.setData({ 'newDrug.description': e.detail.value })
  },

  onDosageInput(e) {
    this.setData({ 'newDrug.dosage': e.detail.value })
  },

  onUnitChange(e) {
    const index = e.detail.value
    this.setData({
      unitIndex: index,
      'newDrug.unit': this.data.units[index]
    })
  },

  addMedicine() {
    const { name, description, dosage, unit, image } = this.data.newDrug
    
    if (!name.trim()) {
      wx.showToast({ title: '请输入药物名称', icon: 'none' })
      return
    }
    
    if (!dosage) {
      wx.showToast({ title: '请输入用量', icon: 'none' })
      return
    }
    
    const newId = Date.now()
    const newMedicine = {
      id: newId,
      name: name.trim(),
      description: description || '未设置',
      dosage,
      unit,
      taken: false,
      status: 'pending',
      image: image || '',
      translateX: 0
    }
    
    if (image && image.startsWith('wxfile://')) {
      wx.showLoading({ title: '保存中...' })
      const cloudPath = `medicine-images/${newId}-${Date.now()}.jpg`
      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: image,
        success: (uploadRes) => {
          wx.hideLoading()
          newMedicine.image = uploadRes.fileID
          const medicines = [...this.data.medicines, newMedicine]
          this.setData({ medicines, showDialog: false, allTaken: false })
          wx.showToast({ title: '添加成功', icon: 'success' })
        },
        fail: () => {
          wx.hideLoading()
          const medicines = [...this.data.medicines, newMedicine]
          this.setData({ medicines, showDialog: false, allTaken: false })
          wx.showToast({ title: '添加成功', icon: 'success' })
        }
      })
    } else {
      const medicines = [...this.data.medicines, newMedicine]
      this.setData({ medicines, showDialog: false, allTaken: false })
      wx.showToast({ title: '添加成功', icon: 'success' })
    }
  },

  // ========== 编辑弹窗 ==========
  
  showEditDialog(id) {
    const item = this.data.medicines.find(m => m.id === id)
    if (!item) return
    
    const unitIndex = this.data.units.indexOf(item.unit)
    
    this.setData({
      showEditDialog: true,
      editDrug: {
        id: item.id,
        name: item.name,
        description: item.description,
        dosage: item.dosage,
        unit: item.unit,
        unitIndex: unitIndex >= 0 ? unitIndex : 0,
        image: item.image || ''
      }
    })
  },

  hideEditDialog() {
    this.setData({ showEditDialog: false })
  },

  onEditImageTap() {
    const id = this.data.editDrug.id
    
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        wx.showLoading({ title: '上传中...' })
        
        const cloudPath = `medicine-images/${id}-${Date.now()}.jpg`
        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: tempFilePath,
          success: (uploadRes) => {
            wx.hideLoading()
            const medicines = this.data.medicines.map(item => {
              if (item.id === id) {
                item.image = uploadRes.fileID
              }
              return item
            })
            this.setData({ 
              medicines,
              'editDrug.image': uploadRes.fileID
            })
            wx.showToast({ title: '上传成功', icon: 'success' })
          },
          fail: (err) => {
            wx.hideLoading()
            const medicines = this.data.medicines.map(item => {
              if (item.id === id) {
                item.image = tempFilePath
              }
              return item
            })
            this.setData({ 
              medicines,
              'editDrug.image': tempFilePath
            })
            wx.showToast({ title: '已保存到本地', icon: 'none' })
          }
        })
      }
    })
  },

  onEditNameInput(e) {
    this.setData({ 'editDrug.name': e.detail.value })
  },

  onEditDescInput(e) {
    this.setData({ 'editDrug.description': e.detail.value })
  },

  onEditDosageInput(e) {
    this.setData({ 'editDrug.dosage': e.detail.value })
  },

  onEditUnitChange(e) {
    const index = e.detail.value
    this.setData({
      'editDrug.unitIndex': index,
      'editDrug.unit': this.data.units[index]
    })
  },

  saveEditMedicine() {
    const { id, name, description, dosage, unit, image } = this.data.editDrug
    
    if (!name.trim()) {
      wx.showToast({ title: '请输入药物名称', icon: 'none' })
      return
    }
    
    if (!dosage) {
      wx.showToast({ title: '请输入用量', icon: 'none' })
      return
    }
    
    const medicines = this.data.medicines.map(item => {
      if (item.id === id) {
        item.name = name.trim()
        item.description = description || '未设置'
        item.dosage = dosage
        item.unit = unit
        item.image = image
      }
      return item
    })
    
    this.setData({ 
      medicines, 
      showEditDialog: false 
    })
    
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    })
  }
})
