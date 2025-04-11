/**
 * UI交互逻辑 - 智能图文对话平台
 * 处理界面交互、主题切换、图片上传预览等功能
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const imagePreview = document.getElementById('image-preview');
    const previewImage = document.getElementById('preview-image');
    const removeImageBtn = document.getElementById('remove-image');
    const instructionInput = document.getElementById('instruction-input');
    const submitBtn = document.getElementById('submit-btn');
    const clearBtn = document.getElementById('clear-btn');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const toast = document.getElementById('toast-message');
    const loadingIndicator = document.getElementById('loading-indicator');
    const themeOverlay = document.getElementById('theme-overlay');

    // 存储当前上传的所有图片
    let uploadedImages = [];
    // 存储主题切换是否正在进行中
    let themeTransitionInProgress = false;
    // 存储上一次主题切换的时间戳
    let lastThemeToggleTime = 0;

    /**
     * 主题切换功能
     */
    function initThemeToggle() {
        console.log("初始化主题切换功能");
        
        if (!themeToggleBtn) {
            console.error("未找到主题切换按钮");
            return;
        }

        // 初始应用主题
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme, false);
        
        // 确保图标位置正确
        centerThemeIcons();
        
        // 移除可能存在的旧事件监听器
        themeToggleBtn.removeEventListener('click', handleThemeToggle);
        
        // 添加新的事件监听器
        themeToggleBtn.addEventListener('click', handleThemeToggle);
    }

    /**
     * 处理主题切换点击事件
     * @param {Event} e - 点击事件对象
     */
    function handleThemeToggle(e) {
        e.preventDefault();
        
        // 检查是否可以切换主题
        const currentTime = Date.now();
        if (currentTime - lastThemeToggleTime < 200) { // 设置200ms的最小间隔
            console.log("点击过于频繁，忽略本次切换");
            return;
        }
        
        // 更新最后切换时间
        lastThemeToggleTime = currentTime;
        
        // 如果动画正在进行中，立即重置状态
        if (themeTransitionInProgress) {
            themeTransitionInProgress = false;
            if (themeOverlay) {
                themeOverlay.classList.remove('active');
            }
        }

        // 获取点击位置
        const rect = themeToggleBtn.getBoundingClientRect();
        const x = e.clientX || (rect.left + rect.width / 2);
        const y = e.clientY || (rect.top + rect.height / 2);
        
        // 获取当前主题并切换
        const currentTheme = document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        console.log("切换主题: 从", currentTheme, "到", newTheme);
        
        // 应用新主题
        applyTheme(newTheme, true, x, y);
        
        // 保存设置
        localStorage.setItem('theme', newTheme);
    }
    
    /**
     * 确保主题图标在按钮中居中
     */
    function centerThemeIcons() {
        const darkIcon = document.querySelector('.dark-icon');
        const lightIcon = document.querySelector('.light-icon');
        
        if (darkIcon && lightIcon) {
            const icons = [darkIcon, lightIcon];
            icons.forEach(icon => {
                icon.style.position = 'absolute';
                icon.style.top = '50%';
                icon.style.left = '50%';
                icon.style.transform = 'translate(-50%, -50%)';
            });
        }
    }
    
    /**
     * 应用指定主题
     * @param {string} theme - 'dark' 或 'light'
     * @param {boolean} animate - 是否使用动画效果
     * @param {number} x - 动画起始点X坐标
     * @param {number} y - 动画起始点Y坐标
     */
    function applyTheme(theme, animate = false, x = undefined, y = undefined) {
        // 设置主题类
        setThemeClasses(theme);
        
        const darkIcon = document.querySelector('.dark-icon');
        const lightIcon = document.querySelector('.light-icon');
        
        if (darkIcon && lightIcon) {
            if (theme === 'dark') {
                darkIcon.style.opacity = '1';
                darkIcon.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';
                lightIcon.style.opacity = '0';
                lightIcon.style.transform = 'translate(-50%, -50%) scale(0.5) rotate(180deg)';
            } else {
                darkIcon.style.opacity = '0';
                darkIcon.style.transform = 'translate(-50%, -50%) scale(0.5) rotate(-180deg)';
                lightIcon.style.opacity = '1';
                lightIcon.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';
            }
        }
        
        if (animate && themeOverlay) {
            themeTransitionInProgress = true;
            
            if (x !== undefined && y !== undefined) {
                themeOverlay.style.setProperty('--x', `${x}px`);
                themeOverlay.style.setProperty('--y', `${y}px`);
            }
            
            themeOverlay.classList.remove('to-light', 'to-dark');
            themeOverlay.classList.add(theme === 'dark' ? 'to-dark' : 'to-light');
            themeOverlay.classList.add('active');
            
            // 缩短动画时间到150ms
            setTimeout(() => {
                themeOverlay.classList.remove('active');
                themeTransitionInProgress = false;
            }, 150);
        }
    }
    
    /**
     * 设置主题相关的类
     * @param {string} theme - 'dark' 或 'light'
     */
    function setThemeClasses(theme) {
        console.log("设置主题类:", theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark-theme');
            document.body.classList.add('dark-theme');
        } else {
            document.documentElement.classList.remove('dark-theme');
            document.body.classList.remove('dark-theme');
        }
    }

    /**
     * 初始化图片上传功能
     */
    function initImageUpload() {
        console.log('初始化图片上传功能');
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');
        
        if (!uploadArea || !fileInput) {
            console.error('未找到上传区域或文件输入元素');
            return;
        }
        
        // 点击上传按钮触发文件选择
        const uploadButton = uploadArea.querySelector('.upload-btn');
        if (uploadButton) {
            console.log('找到上传按钮，添加点击事件');
            uploadButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('点击了上传按钮，触发文件选择');
                fileInput.click();
            });
        } else {
            console.error('未找到上传按钮');
        }

        // 拖放功能
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
            if (files.length > 0) {
                handleFilesUpload(files);
            } else {
                showToast('请上传图片文件', 'error');
            }
        });

        // 文件选择事件
        fileInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
            if (files.length > 0) {
                handleFilesUpload(files);
            } else {
                showToast('请选择图片文件', 'error');
            }
        });

        // 移除图片按钮
        removeImageBtn.addEventListener('click', function() {
            resetImageUpload();
        });
    }

    /**
     * 处理多文件上传
     * @param {File[]} files - 用户上传的文件数组
     */
    function handleFilesUpload(files) {
        // 限制上传数量
        const maxFiles = 5;
        if (uploadedImages.length + files.length > maxFiles) {
            showToast(`最多只能上传${maxFiles}张图片`, 'error');
            return;
        }

        files.forEach(file => {
            // 检查文件类型
            if (!file.type.startsWith('image/')) {
                showToast(`文件 ${file.name} 不是图片文件`, 'error');
                return;
            }

            // 检查文件大小（10MB限制）
            if (file.size > 10 * 1024 * 1024) {
                showToast(`文件 ${file.name} 超过10MB限制`, 'error');
                return;
            }

            // 检查是否已经上传过相同的文件
            if (uploadedImages.some(img => img.name === file.name && img.size === file.size)) {
                showToast(`文件 ${file.name} 已经上传过了`, 'error');
                return;
            }

            // 添加到已上传图片数组
            uploadedImages.push(file);
            
            // 创建预览
            createImagePreview(file);
        });

        // 更新上传区域显示状态
        updateUploadAreaDisplay();

        // 同步更新process.js中的state状态
        if (window.state) {
            window.state.uploadedImages = uploadedImages;
            console.log('UI模块：图片上传完成，已同步更新state.uploadedImages');
            
            // 如果存在checkAndEnableNextButton函数，则调用它
            if (typeof window.checkAndEnableNextButton === 'function') {
                window.checkAndEnableNextButton();
            }
        }
    }

    /**
     * 创建图片预览元素
     * @param {File} file - 图片文件
     */
    function createImagePreview(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.dataset.filename = file.name;

            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = file.name;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '<span class="material-symbols-rounded">close</span>';
            removeBtn.onclick = function(e) {
                e.stopPropagation();
                removeImage(file.name);
            };

            previewItem.appendChild(img);
            previewItem.appendChild(removeBtn);

            // 添加点击选择功能
            previewItem.addEventListener('click', function() {
                toggleImageSelection(this);
            });

            document.getElementById('images-preview').appendChild(previewItem);
        };
        reader.readAsDataURL(file);
    }

    /**
     * 切换图片选择状态
     * @param {HTMLElement} previewItem - 预览元素
     */
    function toggleImageSelection(previewItem) {
        previewItem.classList.toggle('selected');
    }

    /**
     * 移除指定图片
     * @param {string} filename - 要移除的文件名
     */
    function removeImage(filename) {
        // 从数组中移除
        uploadedImages = uploadedImages.filter(file => file.name !== filename);
        
        // 移除预览元素
        const previewItem = document.querySelector(`.preview-item[data-filename="${filename}"]`);
        if (previewItem) {
            previewItem.remove();
        }

        // 同步更新state
        if (window.state) {
            window.state.uploadedImages = uploadedImages;
            
            if (typeof window.checkAndEnableNextButton === 'function') {
                window.checkAndEnableNextButton();
            }
        }

        // 更新上传区域显示状态
        updateUploadAreaDisplay();
    }

    /**
     * 更新上传区域的显示状态
     */
    function updateUploadAreaDisplay() {
        const uploadArea = document.getElementById('upload-area');
        const uploadInner = uploadArea.querySelector('.upload-inner');
        const previewContainer = document.getElementById('images-preview');
        
        if (uploadedImages.length > 0) {
            uploadInner.style.display = 'none';
            previewContainer.style.display = 'grid';
        } else {
            uploadInner.style.display = 'flex';
            previewContainer.style.display = 'none';
        }
    }

    /**
     * 重置图片上传区域
     */
    function resetImageUpload() {
        uploadedImages = [];
        
        // 清空预览区域
        const previewContainer = document.getElementById('images-preview');
        previewContainer.innerHTML = '';
        
        // 重置文件输入
        fileInput.value = '';
        
        // 更新显示状态
        updateUploadAreaDisplay();
        
        // 同步更新state
        if (window.state) {
            window.state.uploadedImages = [];
            console.log('UI模块：图片已清空，已同步重置state.uploadedImages');
            
            if (typeof window.checkAndEnableNextButton === 'function') {
                window.checkAndEnableNextButton();
            }
        }
    }

    /**
     * 显示消息提示
     * @param {string} message - 显示的消息
     * @param {string} type - 消息类型（success 或 error）
     */
    function showToast(message, type = 'success') {
        toast.textContent = message;
        toast.className = 'toast ' + type + ' show';
        
        // 先清除之前的定时器（如果有）
        if (toast.hideTimeout) {
            clearTimeout(toast.hideTimeout);
        }
        
        // 设置新的定时器
        toast.hideTimeout = setTimeout(function() {
            toast.className = 'toast';
        }, 3000);
    }

    /**
     * 更新提交按钮状态
     */
    function updateSubmitButtonState() {
        // 添加非空检查，防止空引用错误
        if (!submitBtn || !instructionInput) return;
        submitBtn.disabled = !uploadedImages.length || !instructionInput.value.trim();
    }

    /**
     * 初始化输入相关功能
     */
    function initInputHandlers() {
        // 监听输入变化
        instructionInput.addEventListener('input', updateSubmitButtonState);
        
        // 清空按钮
        clearBtn.addEventListener('click', function() {
            instructionInput.value = '';
            updateSubmitButtonState();
        });
        
        // 清空聊天按钮
        clearChatBtn.addEventListener('click', function() {
            const chatContainer = document.getElementById('chat-container');
            // 保留欢迎消息，移除所有聊天消息
            const welcomeMessage = chatContainer.querySelector('.welcome-message');
            if (welcomeMessage) {
                chatContainer.innerHTML = '';
                chatContainer.appendChild(welcomeMessage);
            } else {
                chatContainer.innerHTML = '';
                // 如果没有欢迎消息，可以创建一个新的
                const newWelcomeMessage = createWelcomeMessage();
                chatContainer.appendChild(newWelcomeMessage);
            }
        });
    }

    /**
     * 创建欢迎消息元素
     * @returns {HTMLElement} 欢迎消息元素
     */
    function createWelcomeMessage() {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'welcome-message';
        
        const title = document.createElement('h2');
        title.textContent = '欢迎使用智能图文对话平台';
        
        const description = document.createElement('p');
        description.textContent = '上传一张图片并描述你的需求，系统将通过GPT-4o-alle模型进行处理';
        
        const featureList = document.createElement('div');
        featureList.className = 'feature-list';
        
        const features = [
            { icon: 'auto_awesome', text: '一句话生成美图' },
            { icon: 'brush', text: '图像风格转换' },
            { icon: 'palette', text: '创意绘图指令' }
        ];
        
        features.forEach(feature => {
            const featureItem = document.createElement('div');
            featureItem.className = 'feature-item';
            
            const icon = document.createElement('span');
            icon.className = 'material-symbols-rounded feature-icon';
            icon.textContent = feature.icon;
            
            const text = document.createElement('span');
            text.className = 'feature-text';
            text.textContent = feature.text;
            
            featureItem.appendChild(icon);
            featureItem.appendChild(text);
            featureList.appendChild(featureItem);
        });
        
        welcomeDiv.appendChild(title);
        welcomeDiv.appendChild(description);
        welcomeDiv.appendChild(featureList);
        
        return welcomeDiv;
    }

    /**
     * 创建一个新的用户消息元素
     * @param {string} text - 用户消息文本
     * @param {string} imageUrl - 用户上传的图片URL
     * @returns {HTMLElement} 聊天消息元素
     */
    function createUserMessageElement(text, imageUrl) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message user-message';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (imageUrl) {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.className = 'message-image';
            img.alt = '用户上传图片';
            contentDiv.appendChild(img);
        }
        
        const textP = document.createElement('p');
        textP.className = 'message-text';
        textP.textContent = text;
        contentDiv.appendChild(textP);
        
        const timeP = document.createElement('p');
        timeP.className = 'message-time';
        timeP.textContent = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        contentDiv.appendChild(timeP);
        
        messageDiv.appendChild(contentDiv);
        return messageDiv;
    }

    /**
     * 创建一个新的系统消息元素
     * @param {string} text - 系统消息文本，可能包含HTML标记
     * @param {string} imageUrl - 系统返回的图片URL（如果有）
     * @param {string} status - 消息状态 ('success' 或 'error')
     * @returns {HTMLElement} 聊天消息元素
     */
    function createSystemMessageElement(text, imageUrl = null, status = 'success') {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message system-message';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // 如果是错误消息，添加错误标识
        if (status === 'error') {
            contentDiv.classList.add('error-message');
            
            const errorBadge = document.createElement('div');
            errorBadge.className = 'error-badge';
            errorBadge.innerHTML = '<span class="material-symbols-rounded">error</span> 处理出错';
            contentDiv.appendChild(errorBadge);
        }
        
        const textP = document.createElement('div');
        textP.className = 'message-text';
        textP.innerHTML = text; // 使用innerHTML而不是textContent，以支持HTML内容
        contentDiv.appendChild(textP);
        
        if (imageUrl) {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.className = 'message-image';
            img.alt = '系统生成图片';
            img.onclick = function() {
                window.open(imageUrl, '_blank');
            };
            img.style.cursor = 'pointer';
            contentDiv.appendChild(img);
        }
        
        const timeP = document.createElement('p');
        timeP.className = 'message-time';
        timeP.textContent = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        contentDiv.appendChild(timeP);
        
        messageDiv.appendChild(contentDiv);
        return messageDiv;
    }

    // 初始化UI交互
    initThemeToggle();
    
    if (uploadArea && fileInput && imagePreview) {
        initImageUpload();
    }
    
    if (instructionInput && clearBtn) {
        initInputHandlers();
    }

    // 确保加载指示器初始隐藏
    if (loadingIndicator) {
        loadingIndicator.hidden = true;
    }

    // 导出全局UI方法
    window.UI = {
        showToast,
        createUserMessageElement,
        createSystemMessageElement,
        resetImageUpload,
        getUploadedImages: () => uploadedImages,
        updateSubmitButtonState
    };
}); 