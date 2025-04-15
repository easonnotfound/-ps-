/**
 * 页面初始化脚本 - 智能图文对话平台
 * 负责初始化所有页面功能
 */

// 页面加载完成后初始化所有功能
document.addEventListener('DOMContentLoaded', function() {
    console.log('初始化处理页面功能...');
    
    // 检查当前页面是否为处理页面
    if (document.getElementById('step-1')) {
        console.log('检测到处理页面，初始化处理页面功能');
        
        // 手动初始化图片上传功能
        initImageUploadManually();
        
        // 初始化操作选项点击事件
        initOperationOptions();
        
        // 初始化其他功能（如果存在相应函数）
        if (typeof initOperationSelection === 'function') initOperationSelection();
        if (typeof initStepNavigation === 'function') initStepNavigation();
        if (typeof initStyleSelection === 'function') initStyleSelection();
        if (typeof initProcessingAction === 'function') initProcessingAction();
        if (typeof initResultViewer === 'function') initResultViewer();
    }
    
    console.log('页面初始化完成');
});

/**
 * 手动初始化图片上传功能
 * 确保图片上传功能正常工作
 */
function initImageUploadManually() {
    // 检查是否已经初始化过
    if (window.imageUploadInitialized) {
        console.log('图片上传功能已经初始化过，跳过重复初始化');
        return;
    }
    
    console.log('手动初始化图片上传功能');
    
    // 获取DOM元素
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    
    if (!uploadArea || !fileInput) {
        console.error('未找到上传区域或文件输入元素');
        return;
    }
    
    // 如果UI.js已经初始化了上传功能，使用它的函数
    if (window.UI && typeof window.UI.handleFilesUpload === 'function') {
        console.log('使用UI模块提供的handleFilesUpload函数');
        window.handleFilesUpload = window.UI.handleFilesUpload;
        window.imageUploadInitialized = true;
        return;
    }
    
    // 确保全局上传图片数组存在
    if (!window.uploadedImages) {
        window.uploadedImages = [];
    }
    
    // 整个上传区域点击触发文件选择
    uploadArea.addEventListener('click', function(e) {
        // 如果点击的是删除按钮，不触发文件选择
        if (e.target.closest('.delete-button') || e.target.closest('.delete-preview')) {
            console.log('点击了删除按钮，不触发文件选择');
            return;
        }
        
        console.log('点击上传区域，触发文件选择');
        fileInput.click();
    });
    
    // 确保文件输入元素有正确的事件处理器
    fileInput.addEventListener('change', function(e) {
        console.log('文件选择变化，处理文件上传');
        const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
        if (files.length > 0) {
            console.log(`选择了 ${files.length} 个图片文件`);
            
            // 处理上传的图片
            processUploadedFiles(files);
        } else {
            console.warn('未选择图片文件或文件类型不正确');
        }
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
            console.log(`拖放上传了 ${files.length} 个图片文件`);
            
            // 处理上传的图片
            processUploadedFiles(files);
        } else {
            console.warn('未选择图片文件或文件类型不正确');
        }
    });
    
    window.imageUploadInitialized = true;
    console.log('图片上传功能初始化完成');
}

/**
 * 处理上传的图片文件
 * @param {File[]} files - 用户上传的图片文件数组
 */
function processUploadedFiles(files) {
    console.log('处理上传的图片文件');
    
    // 确保全局上传图片数组存在
    if (!window.uploadedImages) {
        window.uploadedImages = [];
    }
    
    // 限制上传数量
    const maxFiles = 5;
    if (window.uploadedImages.length + files.length > maxFiles) {
        alert(`最多只能上传${maxFiles}张图片`);
        return;
    }
    
    // 处理每个文件
    files.forEach(file => {
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            alert(`文件 ${file.name} 不是图片文件`);
            return;
        }

        // 检查文件大小（10MB限制）
        if (file.size > 10 * 1024 * 1024) {
            alert(`文件 ${file.name} 超过10MB限制`);
            return;
        }

        // 检查是否已经上传过相同的文件
        if (window.uploadedImages.some(img => img.name === file.name && img.size === file.size)) {
            alert(`文件 ${file.name} 已经上传过了`);
            return;
        }

        // 添加到已上传图片数组
        window.uploadedImages.push(file);
        
        // 创建预览
        createImagePreview(file);
    });
    
    // 更新上传区域显示状态
    updateUploadAreaDisplay();
    
    // 同步更新state状态
    if (window.state) {
        window.state.uploadedImages = window.uploadedImages;
        console.log('已同步更新state.uploadedImages');
        
        // 手动启用下一步按钮
        if (typeof window.checkAndEnableNextButton === 'function') {
            window.checkAndEnableNextButton();
        } else {
            enableNextButton();
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
        const previewContainer = document.getElementById('image-preview');
        if (!previewContainer) {
            console.error('未找到预览容器');
            return;
        }
        
        const previewItem = document.createElement('div');
        previewItem.className = 'image-preview-item';
        previewItem.dataset.filename = file.name;

        const img = document.createElement('img');
        img.src = e.target.result;
        img.alt = file.name;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'delete-preview';
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

        previewContainer.appendChild(previewItem);
        console.log(`已创建预览：${file.name}`);
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
 * 移除图片
 * @param {string} filename - 图片文件名
 */
function removeImage(filename) {
    // 从数组中移除
    window.uploadedImages = window.uploadedImages.filter(file => file.name !== filename);
    
    // 移除预览元素
    const previewItem = document.querySelector(`.image-preview-item[data-filename="${filename}"]`);
    if (previewItem) {
        previewItem.remove();
        console.log(`已移除图片：${filename}`);
    }
    
    // 更新上传区域状态
    updateUploadAreaDisplay();
    
    // 同步更新state状态
    if (window.state) {
        window.state.uploadedImages = window.uploadedImages;
        
        // 如果process.js中定义了更新按钮状态的函数，调用它
        if (typeof window.checkAndEnableNextButton === 'function') {
            window.checkAndEnableNextButton();
        }
    }
}

/**
 * 更新上传区域的显示状态
 */
function updateUploadAreaDisplay() {
    const uploadArea = document.getElementById('upload-area');
    const previewContainer = document.getElementById('image-preview');
    
    if (!uploadArea || !previewContainer) return;
    
    // 如果有预览图片，显示预览容器
    if (window.uploadedImages && window.uploadedImages.length > 0) {
        previewContainer.style.display = 'grid';
        
        // 启用下一步按钮
        enableNextButton();
    } else {
        previewContainer.style.display = 'none';
    }
}

/**
 * 启用下一步按钮
 * 确保上传图片后能正确启用下一步按钮
 */
function enableNextButton() {
    console.log('尝试启用下一步按钮');
    
    const nextButton = document.getElementById('next-to-step3');
    if (!nextButton) {
        console.error('未找到下一步按钮');
        return;
    }
    
    // 如果已上传图片，启用下一步按钮
    if (window.uploadedImages && window.uploadedImages.length > 0) {
        nextButton.disabled = false;
        console.log('已启用下一步按钮');
    } else {
        nextButton.disabled = true;
    }
}

/**
 * 手动切换到步骤3
 */
function manualGoToStep3() {
    console.log('手动切换到步骤3');
    
    // 隐藏步骤2
    const step2 = document.getElementById('step-2');
    if (step2) {
        step2.classList.remove('active');
        step2.style.display = 'none';
    }
    
    // 显示步骤3
    const step3 = document.getElementById('step-3');
    if (step3) {
        step3.classList.add('active');
        step3.style.display = 'block';
        
        // 更新步骤指示器
        const stepIndicators = document.querySelectorAll('.step-indicator');
        stepIndicators.forEach(indicator => {
            const step = parseInt(indicator.getAttribute('data-step'));
            indicator.classList.remove('active', 'complete');
            
            if (step < 3) {
                indicator.classList.add('complete');
            } else if (step === 3) {
                indicator.classList.add('active');
            }
        });
        
        // 更新步骤连接器
        const connectors = document.querySelectorAll('.step-connector');
        if (connectors.length > 1) {
            connectors[1].classList.add('active');
        }
        
        // 更新当前步骤
        if (window.state) {
            window.state.currentStep = 3;
        }
        
        // 如果存在updateStep3UI函数，调用它
        if (typeof window.updateStep3UI === 'function') {
            window.updateStep3UI();
        }
    } else {
        console.error('未找到步骤3元素');
    }
}

/**
 * 初始化操作选项点击事件
 * 确保点击操作选项后能正确进入下一步
 */
function initOperationOptions() {
    const operationOptions = document.querySelectorAll('.operation-option');
    if (!operationOptions.length) {
        console.error('未找到操作选项元素');
        return;
    }
    
    console.log(`找到 ${operationOptions.length} 个操作选项`);
    
    operationOptions.forEach(option => {
        // 移除可能存在的旧事件监听器
        const newOption = option.cloneNode(true);
        option.parentNode.replaceChild(newOption, option);
        
        // 添加新的点击事件监听器
        newOption.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            console.log('操作选项被点击:', this.getAttribute('data-operation'));
            
            // 移除所有选项的选中状态
            operationOptions.forEach(opt => opt.classList.remove('selected'));
            
            // 添加当前选项的选中状态
            this.classList.add('selected');
            
            // 存储选择的操作类型到全局状态
            if (window.state) {
                window.state.selectedOperation = this.getAttribute('data-operation');
                console.log('已设置操作类型:', window.state.selectedOperation);
            } else {
                console.error('全局状态对象不存在');
            }
            
            // 直接切换到步骤2
            setTimeout(() => {
                console.log('准备切换到步骤2...');
                
                // 隐藏步骤1
                const step1 = document.getElementById('step-1');
                if (step1) {
                    step1.classList.remove('active');
                    step1.style.display = 'none';
                    console.log('已隐藏步骤1');
                }
                
                // 显示步骤2
                const step2 = document.getElementById('step-2');
                if (step2) {
                    step2.classList.add('active');
                    step2.style.display = 'block';
                    console.log('已显示步骤2');
                    
                    // 更新步骤指示器
                    const stepIndicators = document.querySelectorAll('.step-indicator');
                    stepIndicators.forEach(indicator => {
                        const step = parseInt(indicator.getAttribute('data-step'));
                        indicator.classList.remove('active', 'complete');
                        
                        if (step === 1) {
                            indicator.classList.add('complete');
                        } else if (step === 2) {
                            indicator.classList.add('active');
                        }
                    });
                    
                    // 更新步骤连接器
                    const connectors = document.querySelectorAll('.step-connector');
                    if (connectors.length > 0) {
                        connectors[0].classList.add('active');
                    }
                    
                    // 如果存在更新步骤2 UI的函数，调用它
                    if (typeof updateStep2UI === 'function') {
                        updateStep2UI();
                        console.log('已更新步骤2 UI');
                    }
                    
                    // 如果存在显示示例提示词的函数，调用它
                    if (typeof showExamplePrompts === 'function') {
                        showExamplePrompts();
                        console.log('已显示示例提示词');
                    }
                } else {
                    console.error('未找到步骤2元素');
                }
            }, 300);
        });
    });
    
    console.log('操作选项点击事件初始化完成');
}
