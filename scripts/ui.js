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
     * 只在尚未初始化的情况下执行
     */
    function initImageUpload() {
        // 如果已经初始化过，则跳过
        if (window.imageUploadInitialized) {
            console.log('图片上传功能已经初始化过，跳过重复初始化');
            return;
        }
        
        console.log('初始化图片上传功能');
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');
        
        if (!uploadArea || !fileInput) {
            console.error('未找到上传区域或文件输入元素');
            return;
        }
        
        // 确保全局状态存在
        if (!window.uploadedImages) {
            window.uploadedImages = [];
        }
        
        // 整个上传区域点击触发文件选择
        uploadArea.addEventListener('click', function(e) {
            // 如果点击的是删除按钮，不触发文件选择
            if (e.target.closest('.delete-button') || e.target.closest('.delete-preview')) {
                return;
            }
            
            console.log('点击上传区域，触发文件选择');
            fileInput.click();
        });

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
            console.log('文件选择变化，处理文件上传');
            const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
            if (files.length > 0) {
                handleFilesUpload(files);
            } else {
                showToast('请选择图片文件', 'error');
            }
        });
        
        // 标记为已初始化
        window.imageUploadInitialized = true;
    }

    /**
     * 处理多文件上传
     * @param {File[]} files - 用户上传的文件数组
     */
    function handleFilesUpload(files) {
        console.log('UI模块: 处理文件上传，文件数量:', files.length);
        
        // 确保使用全局上传数组
        if (!window.uploadedImages) {
            window.uploadedImages = [];
        }
        
        // 限制上传数量
        const maxFiles = 5;
        if (window.uploadedImages.length + files.length > maxFiles) {
            showToast(`最多只能上传${maxFiles}张图片`, 'error');
            return;
        }

        // 处理每个文件
        const validFiles = [];
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
            if (window.uploadedImages.some(img => img.name === file.name && img.size === file.size)) {
                showToast(`文件 ${file.name} 已经上传过了`, 'error');
                return;
            }

            // 添加到有效文件列表
            validFiles.push(file);
        });
        
        // 处理有效文件
        if (validFiles.length > 0) {
            console.log('有效文件数量:', validFiles.length);
            
            // 添加到已上传图片数组
            validFiles.forEach(file => {
                window.uploadedImages.push(file);
                
                // 创建预览
                createImagePreview(file);
            });
            
            // 确保上传区域状态更新
            updateUploadAreaStatus();

            // 强制同步更新全局状态
            if (!window.state) {
                window.state = {};
            }
            window.state.uploadedImages = [...window.uploadedImages];
            
            // 标记上传图片已更新，帮助其他模块检测变化
            window.uploadedImagesUpdated = true;
            
            console.log('UI模块：图片上传完成，已同步更新state.uploadedImages，当前数量:', window.uploadedImages.length);
            
            // 直接修改所有找到的下一步按钮状态
            const allNextButtons = document.querySelectorAll('.next-btn');
            if (allNextButtons.length > 0) {
                allNextButtons.forEach(btn => {
                    btn.disabled = false;
                    btn.classList.add('active');
                    console.log('UI模块：已启用下一步按钮:', btn.id);
                });
            }
            
            // 特别处理第二步到第三步的按钮
            const nextButton = document.getElementById('next-to-step3');
            if (nextButton) {
                nextButton.disabled = false;
                nextButton.classList.add('active');
                console.log('UI模块：已直接启用下一步按钮 next-to-step3');
            }
            
            // 尝试多种方式调用按钮更新函数
            if (typeof window.checkAndEnableNextButton === 'function') {
                console.log('调用全局checkAndEnableNextButton函数');
                try {
                    window.checkAndEnableNextButton();
                } catch (error) {
                    console.error('调用checkAndEnableNextButton出错:', error);
                }
            }
            
            showToast('图片上传成功', 'success');
        }

        // 重置文件输入框，允许重新选择相同的文件
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.value = '';
        }
    }

    /**
     * 创建图片预览
     * @param {File} file - 上传的图片文件
     */
    function createImagePreview(file) {
        try {
            // 检查是否已达到最大上传数量
            if (window.uploadedImages.length >= 5) {
                showToast('最多只能上传5张图片', 'error');
                return;
            }

            // 检查文件类型
            if (!file.type.startsWith('image/')) {
                showToast('请上传图片文件', 'error');
                return;
            }

            // 检查文件大小（限制为10MB）
            if (file.size > 10 * 1024 * 1024) {
                showToast('图片大小不能超过10MB', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const previewContainer = document.getElementById('image-preview');
                if (!previewContainer) return;

                // 创建预览元素
                const previewItem = document.createElement('div');
                previewItem.className = 'image-preview-item';
                previewItem.dataset.filename = file.name;
                
                // 创建图片元素
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = file.name;
                
                // 创建文件信息元素
                const fileInfo = document.createElement('div');
                fileInfo.className = 'file-info';
                fileInfo.textContent = `${file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name} (${formatFileSize(file.size)})`;
                
                // 创建删除按钮
                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-preview';
                deleteButton.innerHTML = '<span class="material-symbols-rounded">close</span>';
                deleteButton.onclick = (e) => {
                    e.stopPropagation(); // 阻止事件冒泡
                    
                    // 从数组中移除该图片
                    const index = window.uploadedImages.indexOf(file);
                    if (index !== -1) {
                        window.uploadedImages.splice(index, 1);
                        
                        // 移除预览元素
                        previewItem.remove();
                        
                        // 更新上传区域显示状态
                        updateUploadAreaStatus();
                        
                        // 同步更新state状态
                        if (window.state) {
                            window.state.uploadedImages = window.uploadedImages;
                            if (typeof window.checkAndEnableNextButton === 'function') {
                                window.checkAndEnableNextButton();
                            }
                        }
                        
                        showToast('已删除图片');
                    }
                };
                
                // 组装预览元素
                previewItem.appendChild(img);
                previewItem.appendChild(deleteButton);
                previewItem.appendChild(fileInfo);
                previewContainer.appendChild(previewItem);
                
                // 更新上传区域状态
                updateUploadAreaStatus();
                showToast('图片上传成功', 'success');
            };
            
            reader.onerror = (error) => {
                console.error('读取文件失败:', error);
                showToast('读取图片失败，请重试', 'error');
            };
            
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('创建图片预览时出错:', error);
            showToast('创建图片预览失败，请重试', 'error');
        }
    }

    /**
     * 更新上传区域状态
     * 根据已上传图片数量更新UI显示
     */
    function updateUploadAreaStatus() {
        try {
            console.log('更新上传区域状态，当前图片数量:', window.uploadedImages ? window.uploadedImages.length : 0);
            const uploadArea = document.getElementById('upload-area');
            const imagePreview = document.getElementById('image-preview');
            const nextButton = document.getElementById('next-to-step3');
            
            if (!uploadArea || !imagePreview) {
                console.error('找不到上传区域或预览区域元素');
                return;
            }
            
            // 确保全局状态存在
            if (!window.uploadedImages) {
                window.uploadedImages = [];
            }
            
            // 更新上传区域显示
            const uploadInner = uploadArea.querySelector('.upload-inner');
            if (uploadInner) {
                if (window.uploadedImages.length === 0) {
                    // 没有图片时，显示上传提示，隐藏预览区域
                    uploadInner.style.display = 'flex';
                    const iconElement = uploadArea.querySelector('.upload-icon');
                    const textElement = uploadArea.querySelector('.upload-text');
                    const hintElement = uploadArea.querySelector('.upload-hint');
                    
                    if (iconElement) iconElement.textContent = 'cloud_upload';
                    if (textElement) textElement.textContent = '拖放图片至此处或点击上传';
                    if (hintElement) hintElement.textContent = '支持JPG、PNG和GIF格式，最大10MB';
                    
                    imagePreview.style.display = 'none';
                } else if (window.uploadedImages.length >= 5) {
                    // 达到最大数量时，更新提示文本
                    uploadInner.style.display = 'flex';
                    const iconElement = uploadArea.querySelector('.upload-icon');
                    const textElement = uploadArea.querySelector('.upload-text');
                    const hintElement = uploadArea.querySelector('.upload-hint');
                    
                    if (iconElement) iconElement.textContent = 'check_circle';
                    if (textElement) textElement.textContent = `已上传 ${window.uploadedImages.length}/5 张图片`;
                    if (hintElement) hintElement.textContent = '已达到最大上传数量';
                    
                    imagePreview.style.display = 'grid';
                } else {
                    // 有图片但未达到最大数量时，显示上传区域但更新提示文本
                    uploadInner.style.display = 'flex';
                    const iconElement = uploadArea.querySelector('.upload-icon');
                    const textElement = uploadArea.querySelector('.upload-text');
                    const hintElement = uploadArea.querySelector('.upload-hint');
                    
                    if (iconElement) iconElement.textContent = 'add_photo_alternate';
                    if (textElement) textElement.textContent = `已上传 ${window.uploadedImages.length}/5 张图片`;
                    if (hintElement) hintElement.textContent = '您还可以继续添加更多图片';
                    
                    imagePreview.style.display = 'grid';
                }
            }
            
            // 更新下一步按钮状态
            if (nextButton) {
                if (window.uploadedImages.length > 0) {
                    nextButton.disabled = false;
                    nextButton.classList.add('active');
                } else {
                    nextButton.disabled = true;
                    nextButton.classList.remove('active');
                }
            }
            
            // 同步更新全局状态
            if (window.state) {
                window.state.uploadedImages = window.uploadedImages;
                
                // 如果存在checkAndEnableNextButton函数，调用它
                if (typeof window.checkAndEnableNextButton === 'function') {
                    window.checkAndEnableNextButton();
                }
            }
        } catch (error) {
            console.error('更新上传区域状态时出错:', error);
        }
    }

    /**
     * 格式化文件大小
     * @param {number} bytes - 文件大小（字节）
     * @returns {string} 格式化后的文件大小
     */
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 更新已上传图片的状态
     */
    function updateUploadedImages() {
        const previewContainer = document.getElementById('image-preview');
        const hasImages = previewContainer && previewContainer.children.length > 0;
        
        // 更新上传区域的状态
        const uploadContainer = document.querySelector('.upload-container');
        if (uploadContainer) {
            uploadContainer.style.display = hasImages ? 'none' : 'block';
        }
        
        // 更新下一步按钮的状态
        const nextButton = document.querySelector('.next-btn');
        if (nextButton) {
            nextButton.disabled = !hasImages;
        }
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
        const previewContainer = document.getElementById('image-preview');
        
        if (!uploadArea || !uploadInner || !previewContainer) {
            console.error('找不到必要的DOM元素');
            return;
        }

        const hasImages = uploadedImages.length > 0;
        
        // 更新上传区域显示
        uploadInner.style.display = hasImages ? 'none' : 'flex';
        
        // 更新预览容器显示
        previewContainer.style.display = hasImages ? 'grid' : 'none';
        
        // 更新拖放区域的状态
        uploadArea.classList.toggle('has-images', hasImages);
        
        // 更新下一步按钮状态
        const nextButton = document.querySelector('.next-btn');
        if (nextButton) {
            nextButton.disabled = !hasImages;
            
            // 添加视觉反馈
            if (hasImages) {
                nextButton.classList.add('active');
            } else {
                nextButton.classList.remove('active');
            }
        }

        // 更新上传按钮状态
        const uploadBtn = uploadArea.querySelector('.upload-btn');
        if (uploadBtn) {
            uploadBtn.disabled = uploadedImages.length >= 5;
            uploadBtn.title = uploadedImages.length >= 5 ? '最多只能上传5张图片' : '点击选择图片';
        }
    }

    /**
     * 重置图片上传区域
     */
    function resetImageUpload() {
        uploadedImages = [];
        
        // 清空预览区域
        const previewContainer = document.getElementById('image-preview');
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
        const toast = document.getElementById('toast-message');
        if (!toast) {
            console.error('找不到提示元素');
            return;
        }

        // 移除所有已有的类
        toast.className = 'toast';
        
        // 添加新的类
        toast.classList.add(type);
        
        // 设置消息内容
        const icon = type === 'error' ? '⚠️' : '✓';
        toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-message">${message}</span>`;
        
        // 显示提示
        toast.classList.add('show');
        
        // 清除之前的定时器
        if (toast.hideTimeout) {
            clearTimeout(toast.hideTimeout);
        }
        
        // 设置新的定时器
        toast.hideTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, type === 'error' ? 4000 : 2000); // 错误提示显示更长时间
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
        updateSubmitButtonState,
        handleFilesUpload  // 将handleFilesUpload也添加到UI对象中
    };
}); 