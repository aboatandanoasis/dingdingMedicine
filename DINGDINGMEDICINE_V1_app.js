// 用药提醒网页版 - 主逻辑

// 数据存储
let medicines = JSON.parse(localStorage.getItem('medicines') || '[]');
let history = JSON.parse(localStorage.getItem('medicineHistory') || '[]');
let editingId = null;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  initDate();
  renderMedicines();
  updateConfirmButton();
});

// 初始化日期
function initDate() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[now.getDay()];
  const hour = now.getHours();
  
  // 根据时间设置问候语（凌晨3点前算晚上）
  let greeting = '早上好';
  if (hour >= 3 && hour < 12) {
    greeting = '早上好';
  } else if (hour >= 12 && hour < 18) {
    greeting = '中午好';
  } else {
    greeting = '晚上好';
  }
  
  document.getElementById('currentDate').textContent = `${month}月${day}日 ${weekDay}`;
  document.getElementById('greeting').textContent = `${greeting}，记得吃药`;
}

// 渲染药品列表
function renderMedicines() {
  const list = document.getElementById('medicineList');
  
  if (medicines.length === 0) {
    list.innerHTML = '<div class="empty-tip">暂无用药提醒\n点击下方添加药物</div>';
    return;
  }
  
  let html = '';
  medicines.forEach((item, index) => {
    const statusClass = item.taken ? 'taken' : '';
    
    let statusHtml = '';
    if (item.taken) {
      statusHtml = `
        <div class="status-wrapper" onclick="toggleStatus(${index}, event)">
          <div class="status-icon status-done">
            <span class="icon-symbol">✓</span>
          </div>
          <span class="status-label label-done">已吃</span>
        </div>
      `;
    } else if (item.status === 'overdue') {
      statusHtml = `
        <div class="status-wrapper" onclick="toggleStatus(${index}, event)">
          <div class="status-icon status-overdue">
            <span class="icon-symbol">✗</span>
          </div>
          <span class="status-label label-overdue">过时未吃</span>
        </div>
      `;
    } else {
      statusHtml = `
        <div class="status-wrapper" onclick="toggleStatus(${index}, event)">
          <div class="status-icon status-pending">
            <span class="icon-symbol">○</span>
          </div>
          <span class="status-label label-pending">未到时间</span>
        </div>
      `;
    }
    
    html += `
      <div class="medicine-card ${statusClass}">
        <div class="medicine-info">
          <span class="medicine-name">${item.name}</span>
          <span class="medicine-desc">${item.description || '未设置'}</span>
          <span class="medicine-dosage">每次 ${item.dosage} ${item.unit}</span>
        </div>
        ${statusHtml}
        <div class="medicine-card-actions">
          <button class="edit-btn" onclick="showEditDialog(${index}, event)">编辑</button>
          <button class="delete-btn" onclick="deleteMedicine(${index}, event)">删除</button>
        </div>
      </div>
    `;
  });
  
  list.innerHTML = html;
}

// 切换状态
function toggleStatus(index, event) {
  event.stopPropagation();
  
  const statusOptions = ['pending', 'done', 'overdue'];
  const currentStatus = medicines[index].status || 'pending';
  const currentIndex = statusOptions.indexOf(currentStatus);
  const nextIndex = (currentIndex + 1) % statusOptions.length;
  
  medicines[index].status = statusOptions[nextIndex];
  medicines[index].taken = (statusOptions[nextIndex] === 'done');
  
  saveMedicines();
  renderMedicines();
  updateConfirmButton();
}

// 更新确认按钮状态
function updateConfirmButton() {
  const btn = document.getElementById('confirmBtn');
  const allTaken = medicines.length > 0 && medicines.every(item => item.taken);
  
  if (allTaken) {
    btn.classList.add('completed');
    btn.textContent = '已完成';
  } else {
    btn.classList.remove('completed');
    btn.textContent = '我已经吃了';
  }
}

// 一键确认
function confirmAllTaken() {
  if (medicines.length === 0) {
    showToast('请先添加药物');
    return;
  }
  
  const allTaken = medicines.every(item => item.taken);
  if (allTaken) return;
  
  // 记录到历史
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  medicines.forEach(item => {
    history.push({
      medicineName: item.name,
      dosage: item.dosage,
      unit: item.unit,
      takeTime: now.getTime(),
      takeTimeStr: timeStr,
      dateStr: `${now.getMonth() + 1}月${now.getDate()}日`
    });
  });
  
  // 更新状态
  medicines.forEach(item => {
    item.taken = true;
    item.status = 'done';
  });
  
  saveMedicines();
  saveHistory();
  renderMedicines();
  updateConfirmButton();
  
  showToast('已记录');
}

// 保存药品数据
function saveMedicines() {
  localStorage.setItem('medicines', JSON.stringify(medicines));
}

// 保存历史记录
function saveHistory() {
  localStorage.setItem('medicineHistory', JSON.stringify(history));
}

// 显示添加弹窗
function showAddDialog() {
  document.getElementById('drugName').value = '';
  document.getElementById('drugDesc').value = '';
  document.getElementById('drugDosage').value = '';
  document.getElementById('drugUnit').value = '片';
  document.getElementById('addDialog').style.display = 'flex';
}

// 隐藏添加弹窗
function hideAddDialog() {
  document.getElementById('addDialog').style.display = 'none';
}

// 添加药物
function addMedicine() {
  const name = document.getElementById('drugName').value.trim();
  const description = document.getElementById('drugDesc').value.trim();
  const dosage = document.getElementById('drugDosage').value;
  const unit = document.getElementById('drugUnit').value;
  
  if (!name) {
    showToast('请输入药物名称');
    return;
  }
  
  if (!dosage) {
    showToast('请输入用量');
    return;
  }
  
  medicines.push({
    id: Date.now(),
    name: name,
    description: description || '未设置',
    dosage: dosage,
    unit: unit,
    taken: false,
    status: 'pending'
  });
  
  saveMedicines();
  renderMedicines();
  updateConfirmButton();
  hideAddDialog();
  showToast('添加成功');
}

// 显示编辑弹窗
function showEditDialog(index, event) {
  event.stopPropagation();
  editingId = index;
  
  const item = medicines[index];
  document.getElementById('editDrugName').value = item.name;
  document.getElementById('editDrugDesc').value = item.description || '';
  document.getElementById('editDrugDosage').value = item.dosage;
  document.getElementById('editDrugUnit').value = item.unit;
  document.getElementById('editDialog').style.display = 'flex';
}

// 隐藏编辑弹窗
function hideEditDialog() {
  document.getElementById('editDialog').style.display = 'none';
  editingId = null;
}

// 保存编辑
function saveEditMedicine() {
  if (editingId === null) return;
  
  const name = document.getElementById('editDrugName').value.trim();
  const description = document.getElementById('editDrugDesc').value.trim();
  const dosage = document.getElementById('editDrugDosage').value;
  const unit = document.getElementById('editDrugUnit').value;
  
  if (!name) {
    showToast('请输入药物名称');
    return;
  }
  
  if (!dosage) {
    showToast('请输入用量');
    return;
  }
  
  medicines[editingId].name = name;
  medicines[editingId].description = description || '未设置';
  medicines[editingId].dosage = dosage;
  medicines[editingId].unit = unit;
  
  saveMedicines();
  renderMedicines();
  hideEditDialog();
  showToast('保存成功');
}

// 删除药物
function deleteMedicine(index, event) {
  event.stopPropagation();
  
  if (confirm(`确定要删除"${medicines[index].name}"吗？`)) {
    medicines.splice(index, 1);
    saveMedicines();
    renderMedicines();
    updateConfirmButton();
    showToast('已删除');
  }
}

// 跳转到历史页面
function goToHistory() {
  document.getElementById('mainPage').style.display = 'none';
  document.getElementById('historyPage').style.display = 'block';
  renderHistory();
}

// 返回主页
function goBack() {
  document.getElementById('historyPage').style.display = 'none';
  document.getElementById('mainPage').style.display = 'block';
}

// 渲染历史记录
function renderHistory() {
  const list = document.getElementById('historyList');
  const clearSection = document.getElementById('clearSection');
  
  if (history.length === 0) {
    list.innerHTML = `
      <div style="text-align: center; padding: 100px 20px; color: #999;">
        <div style="font-size: 60px; margin-bottom: 20px;">📋</div>
        <div style="font-size: 18px; margin-bottom: 10px;">暂无服药记录</div>
        <div style="font-size: 14px;">确认服药后，记录会显示在这里</div>
      </div>
    `;
    clearSection.style.display = 'none';
    return;
  }
  
  clearSection.style.display = 'flex';
  
  // 按日期分组
  const groups = {};
  history.forEach(record => {
    const date = record.dateStr || formatDate(record.takeTime);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(record);
  });
  
  let html = '';
  Object.keys(groups).reverse().forEach(date => {
    const records = groups[date];
    html += `
      <div class="date-group">
        <div class="date-header">
          <span class="date-text">${date}</span>
          <span class="record-count">共 ${records.length} 次</span>
        </div>
    `;
    
    records.reverse().forEach(record => {
      html += `
        <div class="record-card">
          <span class="record-info">${record.takeTimeStr} · ${record.medicineName} · ${record.dosage}${record.unit} ✓</span>
        </div>
      `;
    });
    
    html += '</div>';
  });
  
  list.innerHTML = html;
}

// 格式化日期
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekDays[date.getDay()]}`;
}

// 清空历史
function clearHistory() {
  if (confirm('确定要清空所有历史记录吗？')) {
    history = [];
    saveHistory();
    renderHistory();
    showToast('已清空');
  }
}

// Toast 提示
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

// 点击遮罩关闭弹窗
document.getElementById('addDialog').addEventListener('click', function(e) {
  if (e.target === this) {
    hideAddDialog();
  }
});

document.getElementById('editDialog').addEventListener('click', function(e) {
  if (e.target === this) {
    hideEditDialog();
  }
});
