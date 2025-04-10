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

    // 存储当前上传的图片（如果有）
    let currentImage = null;
    // 存储主题切换是否正在进行中
    let themeTransitionInProgress = false;

    /**
     * 主题切换功能
     */
    function initThemeToggle() {
        console.log("初始化主题切换功能");
        
        // 查找主题切换按钮
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        if (!themeToggleBtn) {
            console.error("未找到主题切换按钮");
            return;
        }
        
        // 初始应用主题 - 确保图标位置正确
        const savedTheme = localStorage.getItem('theme') || 'light';
        
        // 确保图标位置正确
        centerThemeIcons();
        
        // 添加按钮点击事件 - 优化防抖处理，缩短锁定时间
        themeToggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 如果动画正在进行中，设置一个最大锁定时间100ms
            if (themeTransitionInProgress) {
                console.log("主题切换正在进行中，请等待...");
                
                // 强制设置最大锁定时间为100ms，防止卡死
                setTimeout(() => {
                    themeTransitionInProgress = false;
                }, 100);
                
                return;
            }
            
            console.log("主题按钮被点击");
            
            // 获取鼠标点击位置，用于动画起点
            const rect = themeToggleBtn.getBoundingClientRect();
            const x = e.clientX || (rect.left + rect.width / 2);
            const y = e.clientY || (rect.top + rect.height / 2);
            
            // 获取当前主题并切换
            const currentTheme = document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            console.log("切换主题: 从", currentTheme, "到", newTheme);
            
            // 应用新主题（带动画）
            applyTheme(newTheme, true, x, y);
            
            // 保存设置
            localStorage.setItem('theme', newTheme);
        });
    }
    
    /**
     * 确保主题图标在按钮中居中
     */
    function centerThemeIcons() {
        const darkIcon = document.querySelector('.dark-icon');
        const lightIcon = document.querySelector('.light-icon');
        
        if (darkIcon && lightIcon) {
            // 强制使用正确的居中定位样式
            darkIcon.style.position = 'absolute';
            lightIcon.style.position = 'absolute';
            darkIcon.style.top = '50%';
            darkIcon.style.left = '50%';
            lightIcon.style.top = '50%';
            lightIcon.style.left = '50%';
            
            // 确保图标始终应用正确的变换
            const isDarkTheme = document.documentElement.classList.contains('dark-theme');
            if (isDarkTheme) {
                darkIcon.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';
                lightIcon.style.transform = 'translate(-50%, -50%) scale(0.5) rotate(180deg)';
            } else {
                darkIcon.style.transform = 'translate(-50%, -50%) scale(0.5) rotate(-180deg)';
                lightIcon.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';
            }
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
        const themeToggle = document.querySelector('.theme-toggle');
        const themeEffects = document.querySelector('.theme-toggle-effects');
        
        // 立即应用主题类
        setThemeClasses(theme);
        
        // 确保图标正确居中并设置正确的显示状态
        const darkIcon = document.querySelector('.dark-icon');
        const lightIcon = document.querySelector('.light-icon');
        
        if (darkIcon && lightIcon) {
            // 强制使用正确的居中定位样式
            darkIcon.style.position = 'absolute';
            lightIcon.style.position = 'absolute';
            darkIcon.style.top = '50%';
            darkIcon.style.left = '50%';
            lightIcon.style.top = '50%';
            lightIcon.style.left = '50%';
            
            // 根据主题设置适当的显示状态
            if (theme === 'dark') {
                darkIcon.style.opacity = '1';
                lightIcon.style.opacity = '0';
                darkIcon.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';
                lightIcon.style.transform = 'translate(-50%, -50%) scale(0.5) rotate(180deg)';
            } else {
                darkIcon.style.opacity = '0';
                lightIcon.style.opacity = '1';
                darkIcon.style.transform = 'translate(-50%, -50%) scale(0.5) rotate(-180deg)';
                lightIcon.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';
            }
        }
        
        if (animate && themeOverlay) {
            // 标记动画进行中
            themeTransitionInProgress = true;
            
            // 设置动画起始点
            if (x !== undefined && y !== undefined) {
                themeOverlay.style.setProperty('--x', `${x}px`);
                themeOverlay.style.setProperty('--y', `${y}px`);
            }
            
            // 添加动画方向类
            themeOverlay.classList.remove('to-light', 'to-dark');
            themeOverlay.classList.add(theme === 'dark' ? 'to-dark' : 'to-light');
            
            // 显示覆盖层
            themeOverlay.classList.add('active');
            
            // 添加主题切换方向类到特效容器
            if (themeEffects) {
                themeEffects.classList.remove('to-light', 'to-dark');
                themeEffects.classList.add(theme === 'dark' ? 'to-dark' : 'to-light');
            }
            
            // 添加切换动画类到按钮
            if (themeToggle) {
                themeToggle.classList.add('switching');
            }
            
            // 快速移除覆盖层，减少时间为200ms - 显著加快切换速度
            setTimeout(() => {
                // 移除覆盖层
                themeOverlay.classList.remove('active');
                
                // 立即释放主题切换锁定 - 允许用户立即再次点击
                themeTransitionInProgress = false;
                
                // 延迟移除切换类，以便完成动画
                if (themeToggle) {
                    themeToggle.classList.remove('switching');
                }
                
                // 延迟后移除内联样式，让CSS接管
                if (darkIcon && lightIcon) {
                    darkIcon.style.opacity = '';
                    lightIcon.style.opacity = '';
                }
            }, 200); // 减少覆盖层显示时间至200ms
        } else {
            // 非动画模式下也需要重置标志
            themeTransitionInProgress = false;
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
     * 图片上传和预览功能
     */
    function initImageUpload() {
        // 点击上传区域触发文件选择
        uploadArea.querySelector('.upload-btn').addEventListener('click', function() {
            fileInput.click();
        });

        // 拖放功能
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', function() {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            if (e.dataTransfer.files.length) {
                handleFileUpload(e.dataTransfer.files[0]);
            }
        });

        // 文件选择事件
        fileInput.addEventListener('change', function() {
            if (fileInput.files.length) {
                handleFileUpload(fileInput.files[0]);
            }
        });

        // 移除图片按钮
        removeImageBtn.addEventListener('click', function() {
            resetImageUpload();
        });
    }

    /**
     * 处理文件上传
     * @param {File} file - 用户上传的文件
     */
    function handleFileUpload(file) {
        // 检查文件类型
        if (!file.type.match('image.*')) {
            showToast('请上传图片文件（JPG、PNG、GIF等）', 'error');
            return;
        }

        // 检查文件大小（10MB限制）
        if (file.size > 10 * 1024 * 1024) {
            showToast('图片大小不能超过10MB', 'error');
            return;
        }

        // 存储当前图片
        currentImage = file;
        
        // 显示图片预览
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            uploadArea.querySelector('.upload-inner').style.display = 'none';
            imagePreview.hidden = false;
            
            // 启用提交按钮（如果有文本输入）
            updateSubmitButtonState();
        };
        reader.readAsDataURL(file);
    }

    /**
     * 重置图片上传区域
     */
    function resetImageUpload() {
        uploadArea.querySelector('.upload-inner').style.display = 'flex';
        imagePreview.hidden = true;
        previewImage.src = '';
        fileInput.value = '';
        currentImage = null;
        
        // 禁用提交按钮（如果没有文本输入）
        updateSubmitButtonState();
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
        submitBtn.disabled = !currentImage || !instructionInput.value.trim();
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
        getCurrentImage: () => currentImage,
        updateSubmitButtonState
    };
}); 