// 恋爱日记应用 - 主JavaScript文件

// 数据存储键名
const STORAGE_KEYS = {
    PHOTOS: 'love_diary_photos',
    MEETINGS: 'love_diary_meetings',
    WISHES: 'love_diary_wishes',
    SECRETS: 'love_diary_secrets',
    DAILY: 'love_diary_daily'
};

// 数据管理类
class DataManager {
    // 获取数据
    static getData(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    // 保存数据
    static saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // 添加新数据项
    static addItem(key, item) {
        const data = this.getData(key);
        const newItem = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ...item,
            createdAt: new Date().toISOString()
        };
        data.unshift(newItem); // 新的在前面
        this.saveData(key, data);
        return newItem;
    }

    // 删除数据项
    static deleteItem(key, id) {
        const data = this.getData(key);
        const filteredData = data.filter(item => item.id !== id);
        this.saveData(key, filteredData);
        return filteredData;
    }

    // 更新数据项
    static updateItem(key, id, updates) {
        const data = this.getData(key);
        const index = data.findIndex(item => item.id === id);
        if (index !== -1) {
            data[index] = { ...data[index], ...updates };
            this.saveData(key, data);
            return data[index];
        }
        return null;
    }

    // 获取统计数据
    static getStats() {
        return {
            photos: this.getData(STORAGE_KEYS.PHOTOS).length,
            meetings: this.getData(STORAGE_KEYS.MEETINGS).length,
            wishes: this.getData(STORAGE_KEYS.WISHES).length,
            secrets: this.getData(STORAGE_KEYS.SECRETS).length
        };
    }

    // 导出所有数据
    static exportData() {
        const data = {};
        Object.values(STORAGE_KEYS).forEach(key => {
            data[key] = this.getData(key);
        });
        return JSON.stringify(data, null, 2);
    }

    // 导入数据
    static importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            Object.values(STORAGE_KEYS).forEach(key => {
                if (data[key]) {
                    localStorage.setItem(key, JSON.stringify(data[key]));
                }
            });
            return true;
        } catch (error) {
            console.error('导入数据失败:', error);
            return false;
        }
    }

    // 清空所有数据
    static clearAllData() {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
}

// UI管理类
class UIManager {
    constructor() {
        this.initEventListeners();
        this.initNavigation();
        this.loadAllData();
        this.updateStats();
        this.setTodayDate();
    }

    // 设置表单默认日期为今天
    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        const dateInputs = ['meetingDate', 'dailyDate'];
        dateInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = today;
                element.max = today; // 不能选择未来的日期
            }
        });
    }

    // 初始化事件监听器
    initEventListeners() {
        // 导航链接
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.switchSection(section);
            });
        });

        // 快速操作按钮
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.getAttribute('data-section');
                this.switchSection(section);
            });
        });

        // 照片上传
        const uploadBox = document.getElementById('uploadBox');
        const photoInput = document.getElementById('photoInput');
        const uploadBtn = document.getElementById('uploadBtn');

        if (uploadBox && photoInput && uploadBtn) {
            uploadBox.addEventListener('click', () => photoInput.click());
            uploadBtn.addEventListener('click', () => photoInput.click());
            photoInput.addEventListener('change', (e) => this.handlePhotoUpload(e));

            // 拖放支持
            uploadBox.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadBox.style.borderColor = 'var(--primary-color)';
                uploadBox.style.background = 'var(--light-color)';
            });

            uploadBox.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadBox.style.borderColor = 'var(--primary-light)';
                uploadBox.style.background = 'white';
            });

            uploadBox.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadBox.style.borderColor = 'var(--primary-light)';
                uploadBox.style.background = 'white';

                if (e.dataTransfer.files.length > 0) {
                    // 创建一个模拟的change事件
                    const event = new Event('change');
                    Object.defineProperty(event, 'target', {
                        value: { files: e.dataTransfer.files }
                    });
                    this.handlePhotoUpload(event);
                }
            });
        }

        // 表单提交
        const forms = ['meetingForm', 'wishForm', 'secretForm', 'dailyForm'];
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                form.addEventListener('submit', (e) => this.handleFormSubmit(e, formId));
            }
        });

        // 数据操作按钮
        document.getElementById('exportBtn')?.addEventListener('click', () => this.exportData());
        document.getElementById('importBtn')?.addEventListener('click', () => this.importData());
        document.getElementById('clearBtn')?.addEventListener('click', () => this.clearData());

        // 模态框关闭
        document.querySelector('.close-modal')?.addEventListener('click', () => {
            this.closePhotoModal();
        });

        // 点击模态框背景关闭
        document.getElementById('photoModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'photoModal') {
                this.closePhotoModal();
            }
        });
    }

    // 切换页面部分
    switchSection(sectionId) {
        // 更新导航链接
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('active');
            }
        });

        // 切换内容部分
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
            if (section.id === sectionId) {
                section.classList.add('active');
            }
        });

        // 如果是照片部分，重新加载照片
        if (sectionId === 'photos') {
            this.loadPhotos();
        }
    }

    // 初始化导航
    initNavigation() {
        // 默认显示首页
        this.switchSection('home');
    }

    // 更新统计数据
    updateStats() {
        const stats = DataManager.getStats();
        document.getElementById('photo-count').textContent = stats.photos;
        document.getElementById('meeting-count').textContent = stats.meetings;
        document.getElementById('wish-count').textContent = stats.wishes;
        document.getElementById('secret-count').textContent = stats.secrets;
    }

    // 加载所有数据
    loadAllData() {
        this.loadPhotos();
        this.loadMeetings();
        this.loadWishes();
        this.loadSecrets();
        this.loadDaily();
    }

    // ========== 照片功能 ==========
    async handlePhotoUpload(event) {
        // 支持拖放模拟事件
        const files = event.target ? event.target.files : event.files;
        if (!files || files.length === 0) return;

        // 检查照片数量限制（最多20张）
        const currentPhotos = DataManager.getData(STORAGE_KEYS.PHOTOS);
        const MAX_PHOTOS = 20;

        if (currentPhotos.length >= MAX_PHOTOS) {
            alert(`照片数量已达上限（${MAX_PHOTOS}张），请删除一些旧照片再上传。`);
            return;
        }

        // 计算还能上传多少张
        const remainingSlots = MAX_PHOTOS - currentPhotos.length;
        const filesToProcess = Array.from(files).slice(0, remainingSlots);

        if (files.length > remainingSlots) {
            alert(`最多还能上传 ${remainingSlots} 张照片，已选择前 ${remainingSlots} 张。`);
        }

        for (const file of filesToProcess) {
            // 检查文件大小（最大5MB）
            if (file.size > 5 * 1024 * 1024) {
                alert(`文件 ${file.name} 太大，最大支持5MB`);
                continue;
            }

            // 检查文件类型
            if (!file.type.startsWith('image/')) {
                alert(`文件 ${file.name} 不是图片格式`);
                continue;
            }

            // 将图片转换为base64
            try {
                const base64 = await this.fileToBase64(file);
                const photo = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: base64,
                    date: new Date().toISOString()
                };

                DataManager.addItem(STORAGE_KEYS.PHOTOS, photo);
                this.showNotification('照片上传成功！');
            } catch (error) {
                console.error('图片上传失败:', error);
                alert(`上传照片 ${file.name} 失败`);
            }
        }

        // 清空文件输入（如果存在）
        if (event.target && event.target.value) {
            event.target.value = '';
        }

        // 更新UI
        this.loadPhotos();
        this.updateStats();
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    loadPhotos() {
        const photos = DataManager.getData(STORAGE_KEYS.PHOTOS);
        const photosGrid = document.getElementById('photosGrid');

        if (!photosGrid) return;

        if (photos.length === 0) {
            photosGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-images"></i>
                    <p>还没有照片，快上传第一张吧！</p>
                </div>
            `;
            return;
        }

        photosGrid.innerHTML = photos.map(photo => `
            <div class="photo-card" data-id="${photo.id}">
                <img src="${photo.data}" alt="${photo.name}">
                <div class="photo-overlay">
                    <p>${new Date(photo.date).toLocaleDateString('zh-CN')}</p>
                </div>
            </div>
        `).join('');

        // 添加点击事件
        document.querySelectorAll('.photo-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.getAttribute('data-id');
                this.showPhotoModal(id);
            });
        });
    }

    showPhotoModal(photoId) {
        const photos = DataManager.getData(STORAGE_KEYS.PHOTOS);
        const photo = photos.find(p => p.id === photoId);
        if (!photo) return;

        const modal = document.getElementById('photoModal');
        const modalImage = document.getElementById('modalImage');
        const modalDate = document.getElementById('modalDate');
        const deleteBtn = document.getElementById('deletePhotoBtn');

        if (modalImage) modalImage.src = photo.data;
        if (modalDate) modalDate.textContent = `上传于: ${new Date(photo.date).toLocaleString('zh-CN')}`;

        // 更新删除按钮事件
        if (deleteBtn) {
            deleteBtn.onclick = () => {
                if (confirm('确定要删除这张照片吗？')) {
                    DataManager.deleteItem(STORAGE_KEYS.PHOTOS, photoId);
                    this.loadPhotos();
                    this.updateStats();
                    this.closePhotoModal();
                    this.showNotification('照片已删除');
                }
            };
        }

        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closePhotoModal() {
        const modal = document.getElementById('photoModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // ========== 见面记录功能 ==========
    handleFormSubmit(event, formId) {
        event.preventDefault();

        switch (formId) {
            case 'meetingForm':
                this.addMeeting();
                break;
            case 'wishForm':
                this.addWish();
                break;
            case 'secretForm':
                this.addSecret();
                break;
            case 'dailyForm':
                this.addDaily();
                break;
        }
    }

    addMeeting() {
        const date = document.getElementById('meetingDate').value;
        const activities = document.getElementById('meetingActivities').value.trim();
        const feelings = document.getElementById('meetingFeelings').value.trim();

        if (!date || !activities || !feelings) {
            alert('请填写所有必填字段');
            return;
        }

        const meeting = {
            date,
            activities,
            feelings
        };

        DataManager.addItem(STORAGE_KEYS.MEETINGS, meeting);
        document.getElementById('meetingForm').reset();
        this.loadMeetings();
        this.updateStats();
        this.showNotification('见面记录已保存！');
        this.setTodayDate();
    }

    loadMeetings() {
        const meetings = DataManager.getData(STORAGE_KEYS.MEETINGS);
        const meetingsList = document.getElementById('meetingsList');

        if (!meetingsList) return;

        if (meetings.length === 0) {
            meetingsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <p>还没有见面记录，快添加第一条吧！</p>
                </div>
            `;
            return;
        }

        meetingsList.innerHTML = meetings.map(meeting => `
            <div class="meeting-card">
                <div class="card-header">
                    <div class="card-date">
                        <i class="fas fa-calendar-day"></i>
                        ${new Date(meeting.date).toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
                <div class="card-content">
                    <h4><i class="fas fa-list-check"></i> 做了什么</h4>
                    <p>${this.escapeHtml(meeting.activities).replace(/\n/g, '<br>')}</p>

                    <h4><i class="fas fa-heart"></i> 感受与感想</h4>
                    <p>${this.escapeHtml(meeting.feelings).replace(/\n/g, '<br>')}</p>
                </div>
            </div>
        `).join('');
    }

    // ========== 愿望清单功能 ==========
    addWish() {
        const title = document.getElementById('wishTitle').value.trim();
        const priority = document.getElementById('wishPriority').value;

        if (!title) {
            alert('请输入愿望内容');
            return;
        }

        const wish = {
            title,
            priority,
            completed: false
        };

        DataManager.addItem(STORAGE_KEYS.WISHES, wish);
        document.getElementById('wishForm').reset();
        this.loadWishes();
        this.updateStats();
        this.showNotification('愿望已添加！');
    }

    loadWishes() {
        const wishes = DataManager.getData(STORAGE_KEYS.WISHES);
        const wishesGrid = document.getElementById('wishesGrid');

        if (!wishesGrid) return;

        if (wishes.length === 0) {
            wishesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-star"></i>
                    <p>还没有愿望，快添加第一个吧！</p>
                </div>
            `;
            return;
        }

        wishesGrid.innerHTML = wishes.map(wish => `
            <div class="wish-card ${wish.completed ? 'completed' : ''}" data-id="${wish.id}">
                <h3 class="wish-title">${this.escapeHtml(wish.title)}</h3>
                <span class="wish-priority ${wish.priority}">
                    ${wish.priority === 'low' ? '低' : wish.priority === 'medium' ? '中' : '高'}优先级
                </span>
                <div class="wish-actions">
                    <button class="btn ${wish.completed ? 'btn-secondary' : 'btn-primary'}" onclick="uiManager.toggleWish('${wish.id}')">
                        <i class="fas ${wish.completed ? 'fa-undo' : 'fa-check'}"></i>
                        ${wish.completed ? '标记未完成' : '标记完成'}
                    </button>
                    <button class="btn danger-btn" onclick="uiManager.deleteWish('${wish.id}')">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            </div>
        `).join('');
    }

    toggleWish(wishId) {
        const wishes = DataManager.getData(STORAGE_KEYS.WISHES);
        const wish = wishes.find(w => w.id === wishId);
        if (wish) {
            wish.completed = !wish.completed;
            DataManager.updateItem(STORAGE_KEYS.WISHES, wishId, { completed: wish.completed });
            this.loadWishes();
            this.showNotification(wish.completed ? '愿望已完成！' : '愿望已标记为未完成');
        }
    }

    deleteWish(wishId) {
        if (confirm('确定要删除这个愿望吗？')) {
            DataManager.deleteItem(STORAGE_KEYS.WISHES, wishId);
            this.loadWishes();
            this.updateStats();
            this.showNotification('愿望已删除');
        }
    }

    // ========== 小树洞功能 ==========
    addSecret() {
        const author = document.getElementById('secretAuthor').value.trim();
        const content = document.getElementById('secretContent').value.trim();

        if (!content) {
            alert('请输入想说的话');
            return;
        }

        const secret = {
            author: author || '匿名',
            content
        };

        DataManager.addItem(STORAGE_KEYS.SECRETS, secret);
        document.getElementById('secretForm').reset();
        this.loadSecrets();
        this.updateStats();
        this.showNotification('消息已放入树洞！');
    }

    loadSecrets() {
        const secrets = DataManager.getData(STORAGE_KEYS.SECRETS);
        const secretsList = document.getElementById('secretsList');

        if (!secretsList) return;

        if (secrets.length === 0) {
            secretsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tree"></i>
                    <p>树洞还空空的，快写下第一条消息吧！</p>
                </div>
            `;
            return;
        }

        secretsList.innerHTML = secrets.map(secret => `
            <div class="secret-card">
                <div class="card-header">
                    <div class="card-date">
                        <i class="fas fa-clock"></i>
                        ${new Date(secret.createdAt).toLocaleString('zh-CN')}
                    </div>
                    <div class="card-author">
                        <i class="fas fa-user"></i> ${this.escapeHtml(secret.author)}
                    </div>
                </div>
                <div class="card-content">
                    <p>${this.escapeHtml(secret.content).replace(/\n/g, '<br>')}</p>
                </div>
            </div>
        `).join('');
    }

    // ========== 日常分享功能 ==========
    addDaily() {
        const date = document.getElementById('dailyDate').value;
        const author = document.getElementById('dailyAuthor').value.trim();
        const content = document.getElementById('dailyContent').value.trim();

        if (!date || !author || !content) {
            alert('请填写所有必填字段');
            return;
        }

        const daily = {
            date,
            author,
            content
        };

        DataManager.addItem(STORAGE_KEYS.DAILY, daily);
        document.getElementById('dailyForm').reset();
        this.loadDaily();
        this.showNotification('日常分享已保存！');
        this.setTodayDate();
    }

    loadDaily() {
        const daily = DataManager.getData(STORAGE_KEYS.DAILY);
        const dailyList = document.getElementById('dailyList');

        if (!dailyList) return;

        if (daily.length === 0) {
            dailyList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-sun"></i>
                    <p>还没有日常分享，快分享第一条吧！</p>
                </div>
            `;
            return;
        }

        dailyList.innerHTML = daily.map(item => `
            <div class="daily-card">
                <div class="card-header">
                    <div class="card-date">
                        <i class="fas fa-calendar-day"></i>
                        ${new Date(item.date).toLocaleDateString('zh-CN')}
                    </div>
                    <div class="card-author">
                        <i class="fas fa-user"></i> ${this.escapeHtml(item.author)}
                    </div>
                </div>
                <div class="card-content">
                    <p>${this.escapeHtml(item.content).replace(/\n/g, '<br>')}</p>
                </div>
            </div>
        `).join('');
    }

    // ========== 数据操作功能 ==========
    exportData() {
        const data = DataManager.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `恋爱日记_备份_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('数据已导出！');
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const success = DataManager.importData(e.target.result);
                if (success) {
                    this.loadAllData();
                    this.updateStats();
                    this.showNotification('数据导入成功！');
                } else {
                    alert('数据导入失败，请检查文件格式');
                }
            };
            reader.readAsText(file);
        };

        input.click();
    }

    clearData() {
        if (confirm('警告：这将清空所有数据，包括照片、记录、愿望等。此操作不可撤销！确定要继续吗？')) {
            DataManager.clearAllData();
            this.loadAllData();
            this.updateStats();
            this.showNotification('所有数据已清空');
        }
    }

    // ========== 工具函数 ==========
    showNotification(message) {
        // 创建一个简单的通知
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: var(--shadow);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 添加CSS动画（如果尚未添加）
if (!document.querySelector('style[data-love-diary-animations]')) {
    const style = document.createElement('style');
    style.setAttribute('data-love-diary-animations', 'true');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// 初始化应用
let uiManager = null;

document.addEventListener('DOMContentLoaded', () => {
    uiManager = new UIManager();
    // 使uiManager在全局可访问（用于onclick事件）
    window.uiManager = uiManager;
});

// 防止未定义错误
window.uiManager = window.uiManager || {
    toggleWish: () => console.warn('应用未初始化'),
    deleteWish: () => console.warn('应用未初始化')
};