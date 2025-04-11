/**
 * 图片处理页面交互逻辑 - 智能图文对话平台
 * 处理多步骤图片上传、操作选择、风格选择、处理与展示
 */

// 全局状态对象
const state = {
    currentStep: 1,
    selectedOperation: null,
    uploadedImages: [], // 改为数组存储多个图片
    instruction: '',
    selectedStyle: null,
    processingSuccess: false,
    retryCount: 0
};

window.state = state;

/**
 * 检查并启用下一步按钮
 */
function checkAndEnableNextButton() {
    const nextButton = document.getElementById('next-to-step3');
    if (!nextButton) return;

    // 根据操作类型和状态决定是否启用下一步按钮
    if (state.selectedOperation === 'generate') {
        // 生成模式下只需要有文字描述
        nextButton.disabled = !state.instruction.trim();
    } else {
        // 其他模式需要同时有图片和文字描述
        nextButton.disabled = !(state.uploadedImages.length > 0 && state.instruction.trim());
    }
}

window.checkAndEnableNextButton = checkAndEnableNextButton;

/**
 * 处理图片和指令
 */
async function processImageWithInstruction() {
    const processingStatus = document.getElementById('processing-status');
    const submitBtn = document.getElementById('submit-btn');
    
    try {
        submitBtn.disabled = true;
        processingStatus.textContent = '正在处理...';
        
        // 获取选中的图片
        const selectedImages = Array.from(document.querySelectorAll('.preview-item.selected'))
            .map(item => state.uploadedImages.find(img => img.name === item.dataset.filename))
            .filter(Boolean);
        
        if (state.selectedOperation !== 'generate' && selectedImages.length === 0) {
            throw new Error('请选择要处理的图片');
        }

        // 显示加载指示器
        showLoadingIndicator('正在处理图片...');
        
        // 创建进度条
        createProgressBar();

        // 根据操作类型构建请求数据
        const requestData = {
            operation: state.selectedOperation,
            instruction: state.instruction || '',
            style: state.selectedStyle,
            images: selectedImages
        };

        // 调用API处理图片
        const response = await window.API.processImageWithInstruction(requestData);
        
        if (response.success) {
            state.processingSuccess = true;
            processingStatus.textContent = '处理完成！';
            
            // 更新进度条为完成状态
            updateProgressBar(100, '处理完成');
            
            // 显示结果
            showResultView(response);
        } else {
            throw new Error(response.error || '处理失败，请重试');
        }
    } catch (error) {
        console.error('处理失败:', error);
        processingStatus.textContent = `处理失败: ${error.message}`;
        
        // 更新进度条为错误状态
        updateProgressBar(0, '处理失败');
        
        // 显示错误信息
        handleApiFailure(state.selectedOperation, error.message);
        
        submitBtn.disabled = false;
    } finally {
        // 隐藏加载指示器
        hideLoadingIndicator();
    }
}

/**
 * 显示处理结果
 */
function showResultView(response) {
    const resultView = document.getElementById('result-view');
    const originalImagesContainer = document.getElementById('original-images');
    const processedImagesContainer = document.getElementById('processed-images');
    
    // 清空容器
    originalImagesContainer.innerHTML = '';
    processedImagesContainer.innerHTML = '';
    
    if (state.selectedOperation === 'generate') {
        // 生成模式下只显示生成的图片
        originalImagesContainer.style.display = 'none';
        processedImagesContainer.style.display = 'grid';
        
        // 添加生成的图片
        if (Array.isArray(response.results)) {
            response.results.forEach(result => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'result-image-container';
                
                const img = document.createElement('img');
                img.src = result.url;
                img.alt = '生成的图片';
                
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'download-btn';
                downloadBtn.innerHTML = '<span class="material-symbols-rounded">download</span>';
                downloadBtn.onclick = () => downloadImage(result.url);
                
                imgContainer.appendChild(img);
                imgContainer.appendChild(downloadBtn);
                processedImagesContainer.appendChild(imgContainer);
            });
        }
    } else {
        // 其他模式显示原图和处理后的图片
        originalImagesContainer.style.display = 'grid';
        processedImagesContainer.style.display = 'grid';
        
        // 添加原图
        const selectedImages = Array.from(document.querySelectorAll('.preview-item.selected'));
        selectedImages.forEach(previewItem => {
            const img = previewItem.querySelector('img');
            const clone = img.cloneNode(true);
            clone.className = 'original-image';
            originalImagesContainer.appendChild(clone);
        });
        
        // 添加处理后的图片
        if (Array.isArray(response.results)) {
            response.results.forEach(result => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'result-image-container';
                
                const img = document.createElement('img');
                img.src = result.url;
                img.alt = '处理后的图片';
                
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'download-btn';
                downloadBtn.innerHTML = '<span class="material-symbols-rounded">download</span>';
                downloadBtn.onclick = () => downloadImage(result.url);
                
                imgContainer.appendChild(img);
                imgContainer.appendChild(downloadBtn);
                processedImagesContainer.appendChild(imgContainer);
            });
        }
    }
    
    // 显示结果视图
    resultView.hidden = false;
    
    // 更新结果描述
    updateResultDescription(response);
}

/**
 * 初始化操作选择
 */
function initOperationSelection() {
    const operationOptions = document.querySelectorAll('.operation-option');
    const nextToStep2Btn = document.getElementById('next-to-step2');
    
    operationOptions.forEach(option => {
        option.addEventListener('click', function() {
            // 移除所有选项的选中状态
            operationOptions.forEach(opt => opt.classList.remove('selected'));
            
            // 添加当前选项的选中状态
            this.classList.add('selected');
            
            // 存储选择的操作类型
            state.selectedOperation = this.getAttribute('data-operation');
            
            // 启用下一步按钮（虽然不再需要点击，但还是保留此逻辑以防万一）
            nextToStep2Btn.disabled = false;
            
            // 根据操作类型设置是否需要上传图片
            switch(state.selectedOperation) {
                case 'generate':
                    // 一句话生成美图 - 不需要图片
                    state.requiresImage = false;
                    state.imageOptional = false;
                    break;
                case 'style':
                    // 风格转换 - 必须上传图片
                    state.requiresImage = true;
                    state.imageOptional = false;
                    break;
                case 'creative':
                    // 创意生成 - 图片可选
                    state.requiresImage = false;
                    state.imageOptional = true;
                    break;
            }
            
            // 更新步骤2的UI
            updateStep2UI();
            
            // 显示示例提示词
            showExamplePrompts();
            
            // 直接进入步骤2，无需等待点击下一步按钮
            setTimeout(() => {
                goToStep(2);
            }, 200); // 添加短暂延迟，让用户看到选中效果
        });
    });
    
    // 下一步按钮（保留，但基本不会用到）
    nextToStep2Btn.addEventListener('click', function() {
        if (state.selectedOperation) {
            // 根据操作类型设置是否需要上传图片
            switch(state.selectedOperation) {
                case 'generate':
                    // 一句话生成美图 - 不需要图片
                    state.requiresImage = false;
                    state.imageOptional = false;
                    break;
                case 'style':
                    // 风格转换 - 必须上传图片
                    state.requiresImage = true;
                    state.imageOptional = false;
                    break;
                case 'creative':
                    // 创意生成 - 图片可选
                    state.requiresImage = false;
                    state.imageOptional = true;
                    break;
            }
            
            // 更新步骤2的UI
            updateStep2UI();
            
            // 显示示例提示词
            showExamplePrompts();
            
            // 进入步骤2
            goToStep(2);
        }
    });
}

/**
 * 根据操作类型更新步骤2的UI
 */
function updateStep2UI() {
    const uploadArea = document.getElementById('upload-area');
    const textDescriptionArea = document.getElementById('text-description-area');
    const step2Description = document.getElementById('step2-description');
    const nextToStep3Btn = document.getElementById('next-to-step3');
    
    // 重置按钮状态
    nextToStep3Btn.disabled = true;
    
    // 根据操作类型设置UI
    switch(state.selectedOperation) {
        case 'generate':
            // 一句话生成美图 - 只显示文字描述区域
            uploadArea.style.display = 'none';
            textDescriptionArea.style.display = 'block';
            step2Description.textContent = '输入详细的文字描述，AI将为您生成精美图像';
            break;
        case 'style':
            // 风格转换 - 只显示图片上传区域
            uploadArea.style.display = 'block';
            textDescriptionArea.style.display = 'none';
            step2Description.textContent = '上传您想要转换风格的图片，支持JPG、PNG和GIF格式';
            break;
        case 'creative':
            // 创意生成 - 只显示图片上传区域，文字描述移至步骤3
            uploadArea.style.display = 'block';
            textDescriptionArea.style.display = 'none'; // 改为不显示，等到步骤3再显示
            step2Description.textContent = '上传您想要创意加工的图片，下一步将添加创意描述';
            break;
    }
}

/**
 * 显示与当前操作类型对应的示例提示词
 * @param {string} containerId - 提示词容器的ID，默认为'example-prompts'
 */
function showExamplePrompts(containerId = 'example-prompts') {
    if (!state.selectedOperation) return;
    
    const examplePromptsContainer = document.getElementById(containerId);
    if (!examplePromptsContainer) {
        console.error(`未找到示例提示词容器: ${containerId}`);
        return;
    }
    
    examplePromptsContainer.innerHTML = ''; // 清空现有内容
    
    // 获取当前操作类型的示例提示词
    const prompts = examplePrompts[state.selectedOperation] || [];
    
    // 随机打乱顺序
    const shuffledPrompts = [...prompts].sort(() => Math.random() - 0.5);
    
    // 显示前3个示例
    const displayPrompts = shuffledPrompts.slice(0, 3);
    
    // 创建示例提示词元素
    displayPrompts.forEach(prompt => {
        const promptElement = document.createElement('div');
        promptElement.className = 'example-prompt';
        promptElement.textContent = prompt;
        
        // 点击示例提示词时填充到文本输入框
        promptElement.addEventListener('click', function() {
            const textAreaElement = document.getElementById('image-description');
            if (textAreaElement) {
                textAreaElement.value = prompt;
                state.textDescription = prompt;
                
                // 如果是步骤3中的创意模式，点击示例提示词后启用处理按钮
                const startProcessingBtn = document.getElementById('start-processing');
                if (startProcessingBtn && state.currentStep === 3) {
                    startProcessingBtn.disabled = false;
                } else {
                    // 否则使用标准逻辑检查按钮状态
                    checkAndEnableNextButton();
                }
            }
        });
        
        examplePromptsContainer.appendChild(promptElement);
    });
}

/**
 * 初始化文字描述功能
 */
function initTextDescription() {
    const textDescriptionInput = document.getElementById('image-description');
    const nextToStep3Btn = document.getElementById('next-to-step3');
    
    if (!textDescriptionInput) {
        console.error('未找到图片描述输入框');
        return;
    }
    
    textDescriptionInput.addEventListener('input', function() {
        state.textDescription = this.value.trim();
        checkAndEnableNextButton();
    });
    
    // 添加下一步按钮点击事件
    if (nextToStep3Btn) {
        nextToStep3Btn.addEventListener('click', function() {
            // 进入第三步
            goToStep(3);
        });
    }
}

/**
 * 检查并启用下一步按钮
 */
function checkAndEnableNextButton() {
    const nextButton = document.getElementById('next-to-step3');
    if (!nextButton) return;

    // 根据操作类型和状态决定是否启用下一步按钮
    if (state.selectedOperation === 'generate') {
        // 生成模式下只需要有文字描述
        nextButton.disabled = !state.instruction.trim();
    } else {
        // 其他模式需要同时有图片和文字描述
        nextButton.disabled = !(state.uploadedImages.length > 0 && state.instruction.trim());
    }
}

/**
 * 初始化步骤导航
 */
function initStepNavigation() {
    const backToStep1Btn = document.getElementById('back-to-step1');
    const backToStep2Btn = document.getElementById('back-to-step2');
    const stepIndicators = document.querySelectorAll('.step-indicator');
    
    // 点击步骤指示器直接跳转到对应步骤
    stepIndicators.forEach(indicator => {
        indicator.addEventListener('click', function() {
            const targetStep = parseInt(this.getAttribute('data-step'));
            
            // 只能点击当前已完成的步骤或下一个步骤
            if (targetStep <= state.currentStep || targetStep === state.currentStep + 1) {
                goToStep(targetStep);
            }
        });
    });
    
    // 返回步骤1 - 重新开始所有流程
    if (backToStep1Btn) {
    backToStep1Btn.addEventListener('click', function() {
            // 弹出确认框
            if (confirm('返回到第一步将重置所有选择，确定要继续吗？')) {
                // 重置所有状态
                resetState();
                // 回到第一步
        goToStep(1);
            }
    });
    }
    
    // 返回步骤2
    if (backToStep2Btn) {
    backToStep2Btn.addEventListener('click', function() {
        goToStep(2);
        });
    }
    
    // 监听步骤变化，动态调整步骤3的名称
    document.addEventListener('stepchange', function(e) {
        if (e.detail && e.detail.currentStep === 2) {
            // 当进入步骤2时，根据操作类型更新步骤3的文本
            const step3Indicator = document.querySelector('.step-indicator[data-step="3"]');
            if (!step3Indicator) {
                console.error('未找到步骤3的指示器元素');
                return;
            }
            
            const step3Name = step3Indicator.querySelector('.step-name');
            const step3Desc = step3Indicator.querySelector('.step-desc');
            
            // 进行非空检查，避免空引用错误
            if (!step3Name || !step3Desc) {
                console.error('步骤3指示器的子元素未找到');
                return;
            }
            
            if (state.selectedOperation === 'style') {
                step3Name.textContent = '选择风格';
                step3Desc.textContent = '指定转换风格';
            } else if (state.selectedOperation === 'creative') {
                step3Name.textContent = '选择创意';
                step3Desc.textContent = '指定创意模式';
            } else {
                step3Name.textContent = '选择效果';
                step3Desc.textContent = '指定生成效果';
            }
        }
    });
    
    // 更新步骤连接器状态
    updateStepConnectors();
}

/**
 * 转到指定步骤
 * @param {number} step - 目标步骤号
 */
function goToStep(step) {
    try {
        console.log(`切换到步骤 ${step}，当前操作类型: ${state.selectedOperation}`);
        
    // 保存当前步骤
    const prevStep = state.currentStep;
    state.currentStep = step;
    
        // 隐藏所有步骤
    const stepContents = document.querySelectorAll('.step-content');
    stepContents.forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
        
        // 显示目标步骤
        const targetStep = document.getElementById(`step-${step}`);
        if (targetStep) {
            targetStep.classList.add('active');
            targetStep.style.display = 'block';
            console.log(`成功切换到步骤${step}`);
        } else {
            console.error(`未找到步骤${step}的内容元素，ID: step-${step}`);
            // 尝试直接通过索引查找
            const allStepContents = document.querySelectorAll('.step-content');
            if (allStepContents.length >= step && step > 0) {
                const stepContent = allStepContents[step - 1];
                stepContent.classList.add('active');
                stepContent.style.display = 'block';
                console.log(`通过索引找到并激活步骤${step}`);
            } else {
                return;
            }
        }
        
        // 更新步骤指示器状态
        const stepIndicators = document.querySelectorAll('.step-indicator');
        stepIndicators.forEach(indicator => {
            const indicatorStep = parseInt(indicator.getAttribute('data-step'));
            indicator.classList.remove('active', 'complete');
            
            if (indicatorStep < step) {
                indicator.classList.add('complete');
            } else if (indicatorStep === step) {
                indicator.classList.add('active');
            }
        });
        
        // 更新步骤连接器状态
        updateStepConnectors();
        
        // 处理导航按钮
        const prevStepBtn = document.getElementById('back-to-step' + (step - 1));
        const nextToStep3Btn = document.getElementById('next-to-step3');
        
        // 显示/隐藏上一步按钮
        if (prevStepBtn) {
            prevStepBtn.style.display = 'flex';
        }
        
        // 控制下一步按钮状态
        if (nextToStep3Btn && step === 2) {
            // 恢复显示下一步按钮
            nextToStep3Btn.style.display = 'flex';
            
            // 根据操作类型和状态更新按钮启用状态
            console.log(`步骤2：检查按钮状态，操作类型: ${state.selectedOperation}, 已上传图片: ${!!state.uploadedImages.length}`);
            switch(state.selectedOperation) {
                case 'generate':
                    // 生成模式下只需要有文字描述
                    nextToStep3Btn.disabled = !state.instruction.trim();
                    break;
                case 'style':
                    // 风格转换 - 必须有图片，但不需要预先选择风格
                    nextToStep3Btn.disabled = !(state.uploadedImages.length > 0);
                    break;
                case 'creative':
                    // 创意生成 - 只要有图片就可以继续，文字描述可选
                    nextToStep3Btn.disabled = !(state.uploadedImages.length > 0);
                    break;
                default:
                    // 没有选择操作类型，禁用按钮
                    nextToStep3Btn.disabled = true;
            }
        }
        
        // 步骤3特殊处理
        if (step === 3) {
            // 调用专门的函数处理步骤3的UI
            updateStep3UI();
        }
        
        // 触发自定义步骤变化事件，通知其他组件
        document.dispatchEvent(new CustomEvent('stepchange', { 
            detail: { 
                prevStep: prevStep,
                currentStep: step 
            } 
        }));
        
        return true;
    } catch (error) {
        console.error('切换步骤时出错:', error);
        return false;
    }
}

/**
 * 更新步骤连接器状态
 */
function updateStepConnectors() {
    const stepConnectors = document.querySelectorAll('.step-connector');
    
    stepConnectors.forEach((connector, index) => {
        connector.classList.remove('half', 'complete');
        
        if (index === 0) { // 1到2的连接器
            if (state.currentStep > 1) {
                connector.classList.add('complete');
            }
        } else if (index === 1) { // 2到3的连接器
            if (state.currentStep > 2) {
                connector.classList.add('complete');
            }
        }
    });
}

/**
 * 初始化风格选择
 */
function initStyleSelection() {
    const styleOptions = document.querySelectorAll('.style-option');
    const creativeStyleOptions = document.querySelectorAll('.creative-style-option');
    const startProcessingBtn = document.getElementById('start-processing');
    const styleCustomizationArea = document.getElementById('style-customization-area');
    const styleCustomInstruction = document.getElementById('style-custom-instruction');
    
    // 记录原始选中的风格提示词，用于比较变化
    let originalStylePrompt = '';
    
    // 默认禁用处理按钮
    startProcessingBtn.disabled = true;
    
    // 监听步骤变化事件
    document.addEventListener('stepchange', function(e) {
        if (e.detail && e.detail.currentStep === 3) {
            // 当进入步骤3时，自动更新UI
            console.log('进入步骤3，当前操作:', state.selectedOperation);
            
            // 如果是风格转换，始终显示自定义指令区域
            if (state.selectedOperation === 'style' && styleCustomizationArea) {
                styleCustomizationArea.classList.remove('hidden');
                styleCustomizationArea.classList.add('visible');
                
                // 如果尚未选择风格，则提供默认提示词
                if (!state.selectedStyle && styleCustomInstruction) {
                    styleCustomInstruction.value = "请在这里输入您想要的风格效果描述...";
                    styleCustomInstruction.focus();
                    // 全选文本以便用户可以直接开始输入覆盖默认内容
                    styleCustomInstruction.select();
                }
                
                // 重置原始提示词
                originalStylePrompt = styleCustomInstruction.value;
            }
        }
    });
    
    // 基础风格选择（风格转换操作）
    styleOptions.forEach(option => {
        option.addEventListener('click', function() {
            // 移除所有选项的选中状态
            styleOptions.forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // 添加当前选项的选中状态
            this.classList.add('selected');
            
            // 存储选择的风格
            state.selectedStyle = this.getAttribute('data-style');
            
            // 获取风格对应的提示词
            const styleTitle = this.querySelector('.style-title').textContent;
            const styleDesc = this.querySelector('.style-desc').textContent;
            const stylePrompt = `将图片转换为${styleTitle}，${styleDesc}`;
            state.customInstruction = stylePrompt;
            
            // 记录原始提示词，用于检测用户修改
            originalStylePrompt = stylePrompt;
            
            // 如果自定义指令区域存在，填充初始值
            if (styleCustomInstruction) {
                // 填充默认的风格提示词作为起点
                styleCustomInstruction.value = stylePrompt;
                
                // 聚焦文本区域以便用户立即编辑
                setTimeout(() => {
                    styleCustomInstruction.focus();
                    // 将光标移到文本末尾
                    styleCustomInstruction.setSelectionRange(stylePrompt.length, stylePrompt.length);
                }, 100);
            }
            
            // 启用处理按钮
            startProcessingBtn.disabled = false;
        });
    });
    
    // 监听自定义风格指令输入
    if (styleCustomInstruction) {
        styleCustomInstruction.addEventListener('input', function() {
            if (state.currentStep === 3 && state.selectedOperation === 'style') {
                // 风格转换模式下，更新自定义指令
                const newInstruction = this.value.trim();
                state.customInstruction = newInstruction;
                
                // 检查用户是否修改了原始提示词
                if (newInstruction !== originalStylePrompt && state.selectedStyle) {
                    console.log("用户修改了提示词，取消风格选择");
                    
                    // 取消选中的风格
                    styleOptions.forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    
                    // 清除选择的风格
                    state.selectedStyle = null;
                }
                
                // 确保当有文本输入时启用处理按钮，即使没有选择预定义风格
                if (newInstruction !== '') {
                    startProcessingBtn.disabled = false;
                } else {
                    // 如果文本为空且没有选择风格，则禁用处理按钮
                    if (!state.selectedStyle) {
                        startProcessingBtn.disabled = true;
                    }
                }
            }
        });
    }
    
    // 创意风格选择（创意生成操作）
    creativeStyleOptions.forEach(option => {
        option.addEventListener('click', function() {
            // 移除所有创意风格选项的选中状态
            creativeStyleOptions.forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // 添加当前选项的选中状态
            this.classList.add('selected');
            
            // 存储选择的风格
            state.selectedStyle = this.getAttribute('data-style');
            
            // 获取风格对应的提示词
            const creativeTitle = this.querySelector('.creative-title').textContent;
            const creativeDesc = this.querySelector('.creative-desc').textContent;
            const creativePrompt = `创建${creativeTitle}，${creativeDesc}`;
            state.customInstruction = creativePrompt;
            
            // 将选择的风格提示词自动填充到图片描述文本框
            const imageDescriptionElement = document.getElementById('image-description');
            if (imageDescriptionElement) {
                imageDescriptionElement.value = creativePrompt;
                // 记录原始提示词，用于检测用户修改
                originalStylePrompt = creativePrompt;
                // 更新状态
                state.textDescription = creativePrompt;
            }
            
            // 高阶创意风格选择后直接启用处理按钮
            startProcessingBtn.disabled = false;
        });
    });
    
    // 监听文字描述输入（作为自定义指令）
    const imageDescriptionElement = document.getElementById('image-description');
    if (imageDescriptionElement) {
        imageDescriptionElement.addEventListener('input', function() {
            if (state.currentStep === 3 && state.selectedOperation === 'creative') {
                // 创意生成模式下，将文字描述作为自定义指令
                const newDescription = this.value.trim();
                state.textDescription = newDescription;
                
                // 检查用户是否修改了原始提示词
                if (newDescription !== originalStylePrompt && state.selectedStyle) {
                    console.log("用户修改了创意提示词，取消风格选择");
                    
                    // 取消选中的风格
                    creativeStyleOptions.forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    
                    // 清除选择的风格但保持按钮可用
                    state.selectedStyle = null;
                }
                
                // 如果有文字描述，则启用处理按钮
                startProcessingBtn.disabled = newDescription === '';
            }
        });
    }
}

/**
 * 初始化处理操作
 * 处理用户上传的图片或文本描述
 */
function initProcessingAction() {
    const startProcessingBtn = document.getElementById('start-processing');
    if (!startProcessingBtn) return;
    
    startProcessingBtn.addEventListener('click', async function() {
        try {
            // 获取当前的图片和指令
            const imageData = state.uploadedImages;
            const operation = state.selectedOperation;
            
            // 构建指令内容
            let instruction = '';
            
            if (operation === 'generate') {
                // 生成模式 - 使用文本描述
                instruction = state.textDescription;
                if (!instruction) {
                    throw new Error('请输入图片描述');
                }
            } else if (operation === 'style') {
                // 风格转换模式
                if (!imageData) {
                    throw new Error('请先上传图片');
                }
                
                // 获取选择的风格或自定义风格
                const style = state.selectedStyle;
                let stylePrompt = '';
                
                if (style === 'custom' && state.customInstruction) {
                    // 使用自定义风格指令
                    stylePrompt = state.customInstruction;
                } else {
                    // 使用预定义风格
                    switch(style) {
                        case 'anime': stylePrompt = '动漫风格，清新可爱的日系动漫风格'; break;
                        case 'oil': stylePrompt = '油画风格，厚重的笔触和丰富的色彩'; break;
                        case 'sketch': stylePrompt = '素描风格，黑白素描效果'; break;
                        case 'pixel': stylePrompt = '像素艺术风格，复古游戏像素效果'; break;
                        case 'watercolor': stylePrompt = '水彩画风格，轻盈透明的水彩效果'; break;
                        case 'comic': stylePrompt = '漫画风格，美式漫画风格，强调线条和分块色彩'; break;
                        case 'vintage': stylePrompt = '复古风格，复古照片效果，怀旧色调'; break;
                        case 'cyberpunk': stylePrompt = '赛博朋克风格，霓虹灯效果和未来感'; break;
                        default: stylePrompt = '艺术风格';
                    }
                }
                
                instruction = `请将这张图片转换为以下风格：${stylePrompt}。请保持图像主体特征，仅应用风格变化。`;
                
            } else if (operation === 'creative') {
                // 创意生成模式
                if (!imageData) {
                    throw new Error('请先上传图片');
                }
                
                const style = state.selectedStyle;
                let creativePrompt = '';
                
                if (style === 'custom' && state.customInstruction) {
                    // 使用自定义创意指令
                    creativePrompt = state.customInstruction;
                } else {
                    // 使用预定义创意类型
                    switch(style) {
                        case 'creative': creativePrompt = '基于图片创建创意变体'; break;
                        case 'poster': creativePrompt = '将图片转换为艺术海报'; break;
                        case 'sticker': creativePrompt = '将主体转换为可爱的贴纸，带有白色边框'; break;
                        default: creativePrompt = '创意变体';
                    }
                }
                
                instruction = `请基于这张图片创建以下效果：${creativePrompt}。请保持主体识别性，但可以添加创意元素。`;
            } else {
                throw new Error('未选择有效的操作类型');
            }
            
            // 显示处理中状态
            console.log("处理指令:", {
                operation: operation,
                instruction: instruction,
                image: imageData ? '已上传' : '无'
            });
            
            // 禁用重试逻辑，防止多次调用API
            const maxRetries = 0; // 设为0表示禁用重试
            let processingSuccess = false;
            const timeoutSeconds = 180; // API最大等待时间
            
            // 显示加载指示器
            showLoadingIndicator('准备处理请求...');
            
            // 创建和显示进度条
            createProgressBar();
            
            // 准备进度文本
            let progressStage = 0;
            const progressStages = [
                '正在分析请求...',
                '正在处理图像数据...',
                '正在应用创意效果...',
                '正在生成最终结果...',
                '正在优化输出质量...',
                '请继续耐心等待...',
                '处理需要较长时间，请再等待...',
                '图像处理进行中，最长等待180秒...',
                '生成高质量图片中，请稍候...'
            ];
            
            // 创建进度更新函数
            const updateProgress = (percentage = null, message = null) => {
                if (percentage !== null) {
                    // 如果有明确的进度百分比，直接使用它
                    updateProgressBar(percentage, message || `处理进度: ${percentage}%`);
                } else {
                    // 否则使用预设的阶段性信息
                    const stageMessage = progressStages[progressStage % progressStages.length];
                    progressStage++;
                    const estimatedProgress = Math.min(95, 5 + (progressStage * 10)); // 预估进度，最高95%
                    updateProgressBar(estimatedProgress, stageMessage);
                }
            };
            
            // 启动初始进度更新
            updateProgress(5, '开始处理请求...');
            
            // 仅在没有实时进度更新时，使用定时器模拟进度
            let hasRealProgress = false;
            const progressInterval = setInterval(() => {
                if (!hasRealProgress) {
                    updateProgress();
                }
            }, 15000); // 每15秒更新一次模拟进度

                try {
                    // 创建带超时的Promise
                    const apiResponsePromise = new Promise(async (resolve, reject) => {
                        try {
                            // 设置超时计时器
                            const timeoutId = setTimeout(() => {
                                reject(new Error(`处理超时（${timeoutSeconds}秒）`));
                            }, timeoutSeconds * 1000);
                            
                            // 调用API
                            let response;
                            if (imageData && imageData.length > 0) {
                                // 获取选中的图片，如果没有选中则使用第一张
                                const selectedImages = document.querySelectorAll('.preview-item.selected');
                                let selectedImage;
                                
                                if (selectedImages.length > 0) {
                                    // 使用选中的第一张图片
                                    const filename = selectedImages[0].dataset.filename;
                                    selectedImage = imageData.find(img => img.name === filename);
                                } else {
                                    // 如果没有选中的图片，使用第一张上传的图片
                                    selectedImage = imageData[0];
                                }
                                
                                console.log('将发送图片到API:', selectedImage.name);
                                response = await window.API.processImageWithInstruction(selectedImage, instruction);
                            } else {
                                console.log('无图片数据，只发送文本指令');
                                response = await window.API.processImageWithInstruction(null, instruction);
                            }
                            
                            // 检查响应中是否包含进度信息
                            if (response && response.type === 'progress') {
                                // 标记有实时进度
                                hasRealProgress = true;
                                
                                // 更新进度条和加载文本
                                if (response.percentage) {
                                    updateProgressBar(response.percentage, response.content || '正在处理中...');
                                }
                                
                                // 继续轮询API直到处理完成
                                let pollingCount = 0;
                                const maxPolling = 60; // 最多轮询60次
                                const pollingInterval = 3000; // 每3秒轮询一次
                                
                                while (pollingCount < maxPolling) {
                                    // 等待一段时间后再次查询
                                    await new Promise(r => setTimeout(r, pollingInterval));
                                    
                                    // 发送轮询请求查询进度
                                    if (response.taskId) {
                                        // 构建进度查询指令
                                        const progressCheckInstruction = `查询任务进度: ${response.taskId}`;
                                        const progressResponse = await window.API.processImageWithInstruction(null, progressCheckInstruction);
                                        
                                        // 检查是否有进度更新
                                        if (progressResponse.type === 'progress') {
                                            // 更新进度显示
                                            if (progressResponse.percentage) {
                                                hasRealProgress = true;
                                                updateProgressBar(
                                                    progressResponse.percentage, 
                                                    progressResponse.content || `处理进度: ${progressResponse.percentage}%`
                                                );
                                            }
                                            
                                            if (progressResponse.percentage >= 100 || 
                                                (progressResponse.content && progressResponse.content.includes('生成完成'))) {
                                                // 处理完成，获取最终结果
                                                response = progressResponse;
                                                break;
                                            }
                                        } else if (progressResponse.type === 'text_and_image') {
                                            // 收到最终结果
                                            updateProgressBar(100, '处理完成！');
                                            response = progressResponse;
                                            break;
                                        }
                                    }
                                    
                                    pollingCount++;
                                }
                            }
                            
                            // 清除超时计时器
                            clearTimeout(timeoutId);
                            resolve(response);
                        } catch (error) {
                            reject(error);
                        }
                    });
                    
                    // 用于存储最后一次API响应，即使超时也可能有部分结果
                    let lastApiResponse = null;
                    
                        // 等待API响应
                        const apiResponse = await apiResponsePromise;
                        lastApiResponse = apiResponse;
                        
                        console.log("API处理结果:", apiResponse);
                        
                        // 检查API响应是否成功
                        if (apiResponse.status === 'error') {
                    throw new Error(apiResponse.content || '处理请求失败');
                        }
                        
                        // 提取处理结果
                        if (apiResponse.type === 'text_and_image') {
                            // 有图片和文字
                            state.processedImage = apiResponse.imageUrl;
                            state.processDescription = apiResponse.content || '处理完成！';
                            
                            // 记录原始图片尺寸，用于保持比例
                            if (apiResponse.originalWidth && apiResponse.originalHeight) {
                                state.originalWidth = apiResponse.originalWidth;
                                state.originalHeight = apiResponse.originalHeight;
                            }
                            
                            // 记录任务和生成ID
                            if (apiResponse.taskId) state.taskId = apiResponse.taskId;
                            if (apiResponse.genId) state.genId = apiResponse.genId;
                            
                    // 检查图片URL是否有效（必须是http开头的URL）
                            if (!state.processedImage || 
                        !(state.processedImage.startsWith('http') || state.processedImage.startsWith('data:'))) {
                        console.error("API返回的图片URL无效:", state.processedImage);
                        showToast('API返回的图片URL无效', 'error');
                    } else {
                        processingSuccess = true;
                    }
                } else if (apiResponse.type === 'text') {
                    // 纯文本响应
                    state.processDescription = apiResponse.content || '处理完成，但没有图片结果。';
                    state.processedImage = null;
                    
                    if (apiResponse.status === 'success') {
                            processingSuccess = true;
                    }
                        } else if (apiResponse.type === 'progress') {
                    // 进度信息 - 已经有任务ID，但还没有最终结果
                    if (apiResponse.taskId) {
                        state.taskId = apiResponse.taskId;
                    }
                    if (apiResponse.genId) {
                        state.genId = apiResponse.genId;
                    }
                    
                    // 显示进度信息
                    state.processDescription = `处理进行中：${apiResponse.content || '请等待结果'}`;
                    
                    // 等待一段时间后打开结果，可能会在结果页通过延迟响应获取完整结果
                                processingSuccess = true;
                            } else {
                    console.error("未知的API响应类型:", apiResponse.type);
                    throw new Error(`未知的API响应类型: ${apiResponse.type}`);
                }
                
                // 更新进度条为100%
                updateProgressBar(100, '处理完成！');
            
            // 清除进度更新定时器
            clearInterval(progressInterval);
            
                // 隐藏加载指示器
                hideLoadingIndicator();
                
                // 显示成功消息
                showToast(processingSuccess ? '处理完成！' : '处理请求返回了错误', processingSuccess ? 'success' : 'error');
                
                // 显示处理结果
                showResultView({
                    originalImage: imageData ? URL.createObjectURL(imageData) : null,
                    content: state.processDescription,
                    imageUrl: state.processedImage,
                    status: processingSuccess ? 'success' : 'error',
                    originalWidth: state.originalWidth,
                    originalHeight: state.originalHeight,
                    taskId: state.taskId,
                    genId: state.genId
                });

            } catch (error) {
                console.error("API处理错误:", error);
                
                // 清除进度更新定时器
                clearInterval(progressInterval);
                
                // 显示错误信息
                let errorMessage = error.message || '处理请求时出错';
                
                // 尝试从最后一次响应中提取更多信息
                if (lastApiResponse && lastApiResponse.content) {
                    errorMessage += `\n\n${lastApiResponse.content}`;
                }
                
                // 更新状态
                state.processDescription = errorMessage;
                state.processingStatus = 'error';
                
                // 如果API请求失败，使用错误处理函数
                await handleApiFailure(
                    operation, 
                    imageData ? URL.createObjectURL(imageData) : null
                );
                
                // 隐藏加载指示器
            hideLoadingIndicator();
            showToast(error.message || '处理图片失败，请重试', 'error');
            }
        } catch (error) {
            console.error("准备处理请求时出错:", error);
            showToast(error.message || '处理准备失败', 'error');
            hideLoadingIndicator();
        }
    });
}

/**
 * 显示加载指示器
 * @param {string} message - 显示的加载消息
 */
function showLoadingIndicator(message = '正在处理...') {
    const loadingIndicator = document.getElementById('loading-indicator');
    const loadingText = loadingIndicator.querySelector('.loading-text');
    
    if (loadingText) {
        loadingText.textContent = message;
    }
    
    loadingIndicator.hidden = false;
}

/**
 * 隐藏加载指示器
 */
function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    loadingIndicator.hidden = true;
    
    // 隐藏进度条
    const progressBarContainer = document.getElementById('progress-bar-container');
    if (progressBarContainer) {
        progressBarContainer.style.display = 'none';
    }
}

/**
 * 创建进度条
 */
function createProgressBar() {
    // 检查是否已经存在进度条
    let progressBarContainer = document.getElementById('progress-bar-container');
    
    if (!progressBarContainer) {
        // 创建进度条容器
        progressBarContainer = document.createElement('div');
        progressBarContainer.id = 'progress-bar-container';
        progressBarContainer.className = 'progress-bar-container';
        
        // 创建进度条
        const progressBar = document.createElement('div');
        progressBar.id = 'progress-bar';
        progressBar.className = 'progress-bar';
        
        // 创建进度文本
        const progressText = document.createElement('div');
        progressText.id = 'progress-text';
        progressText.className = 'progress-text';
        progressText.textContent = '准备中...';
        
        // 添加进度条和文本到容器
        progressBarContainer.appendChild(progressBar);
        progressBarContainer.appendChild(progressText);
        
        // 将进度条容器添加到加载指示器中
        const loadingIndicator = document.getElementById('loading-indicator');
        loadingIndicator.appendChild(progressBarContainer);
    } else {
        // 如果已存在，重置进度条
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        
        if (progressBar) progressBar.style.width = '0%';
        if (progressText) progressText.textContent = '准备中...';
        
        progressBarContainer.style.display = 'block';
    }
    
    return progressBarContainer;
}

/**
 * 更新进度条
 * @param {number} percentage - 进度百分比（0-100）
 * @param {string} message - 进度消息
 */
function updateProgressBar(percentage, message) {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const progressBarContainer = document.getElementById('progress-bar-container');
    
    if (!progressBar || !progressText || !progressBarContainer) {
        console.error('找不到进度条元素');
        return;
    }
    
    // 确保进度条容器可见
    progressBarContainer.style.display = 'block';
    
    // 确保百分比在有效范围内
    const validPercentage = Math.max(0, Math.min(100, percentage));
    
    // 获取当前宽度和目标宽度
    const currentWidth = parseFloat(progressBar.style.width) || 0;
    const targetWidth = validPercentage;
    
    // 如果是前进的进度，使用平滑过渡；如果是倒退，直接更新
    if (targetWidth >= currentWidth) {
        progressBar.style.transition = 'width 0.5s cubic-bezier(0.1, 0.7, 0.6, 0.9)';
    } else {
        progressBar.style.transition = 'none';
    }
    
    // 更新进度条宽度
    progressBar.style.width = `${validPercentage}%`;
    
    // 进度条颜色随进度变化
    if (validPercentage < 30) {
        progressBar.style.background = 'linear-gradient(to right, #4a51d8, #7c82f0)';
    } else if (validPercentage < 70) {
        progressBar.style.background = 'linear-gradient(to right, #4a51d8, #7c82f0, #42b983)';
    } else {
        progressBar.style.background = 'linear-gradient(to right, #7c82f0, #42b983)';
    }
    
    // 准备进度文本
    let statusText = '';
    let percentageText = '';
    
    // 根据百分比添加阶段性描述
    if (validPercentage === 0) {
        statusText = '准备中...';
    } else if (validPercentage <= 5) {
        statusText = '正在分析请求...';
    } else if (validPercentage <= 20) {
        statusText = '正在处理图像数据...';
    } else if (validPercentage <= 40) {
        statusText = '应用创意效果中...';
    } else if (validPercentage <= 60) {
        statusText = '生成图像中...';
    } else if (validPercentage <= 80) {
        statusText = '优化输出质量...';
    } else if (validPercentage < 100) {
        statusText = '即将完成...';
    } else {
        statusText = '处理完成！';
    }
    
    // 如果提供了消息，优先使用它
    if (message) {
        // 尝试从消息中提取百分比
        const percentMatch = message.match(/(\d+)[%％]/);
        if (percentMatch && percentMatch[1]) {
            percentageText = `${percentMatch[1]}%`;
        } else {
            percentageText = `${validPercentage}%`;
        }
        
        // 如果消息包含详细进度信息，直接使用
        if (message.includes('进度') || message.includes('生成中') || message.includes('排队中')) {
            statusText = message;
        } else {
            // 否则将消息与默认状态文本结合
            statusText = message;
        }
    } else {
        percentageText = `${validPercentage}%`;
    }
    
    // 更新进度文本
    progressText.innerHTML = `<span class="progress-percentage">${percentageText}</span> ${statusText}`;
    
    // 更新加载指示器文本
    showLoadingIndicator(`${statusText} ${percentageText}`);
    
    // 如果进度达到100%，添加完成效果
    if (validPercentage >= 100) {
        progressBar.classList.add('complete');
        setTimeout(() => {
            progressBar.classList.remove('complete');
        }, 1000);
    }
}

/**
 * 显示处理结果视图
 * @param {Object} response - API响应对象
 */
function showResultView(response = null) {
    try {
        console.log("显示结果视图，响应数据:", response);
        
        // 如果提供了响应对象，使用它来更新状态
        if (response) {
            // 处理响应和原始图片
            const hasOriginalImage = response.originalImage || (state.uploadedImages.length > 0 && state.selectedOperation !== 'generate');
            const originalImageSrc = response.originalImage || (state.uploadedImages.length > 0 ? URL.createObjectURL(state.uploadedImages[0]) : '');
            
            // 处理结果图片
            let processedImageSrc;
            if (response.imageUrl) {
                // 判断是否是远程URL或本地路径
                if (response.imageUrl.startsWith('http') || response.imageUrl.startsWith('data:')) {
                    processedImageSrc = response.imageUrl;
                } else {
                    // 本地文件路径
                    processedImageSrc = response.imageUrl;
                }
                
                // 设置状态
                state.processedImage = processedImageSrc;
            } else {
                // 如果没有图片URL，不设置处理后的图片
                state.processedImage = null;
            }
            
            state.processDescription = response.content || '处理完成';
            state.processingStatus = response.status || 'success';
            
            // 记录原始尺寸
            if (response.originalWidth) state.originalWidth = response.originalWidth;
            if (response.originalHeight) state.originalHeight = response.originalHeight;
        }
        
        // 获取结果容器元素
        const resultContainer = document.getElementById('result-container');
        const originalImage = document.getElementById('original-image');
        const processedImage = document.getElementById('processed-image');
        const resultDescription = document.getElementById('result-description');
        const resultComparison = document.querySelector('.result-comparison');
        const resultOriginal = document.querySelector('.result-original');
        const resultProcessed = document.querySelector('.result-processed');
        const downloadResultBtn = document.getElementById('download-result-btn');
        
        if (!resultContainer || !resultDescription) {
            console.error("找不到结果容器元素");
            showToast("无法显示结果，请重新加载页面", "error");
            return;
        }

        // 判断是否有原始图片（生成模式下没有原始图片）
        const hasOriginalImage = state.uploadedImages.length > 0 && state.selectedOperation !== 'generate';
        
        // 检查是否有处理后的图片
        const hasProcessedImage = state.processedImage !== null;
        
        // 处理仅文本响应 - 无图片情况
        if (!hasProcessedImage) {
            console.log("仅文本响应，无图片显示");
            
            // 隐藏图片比较区域，显示全屏错误信息
            if (resultComparison) {
                resultComparison.style.display = 'none';
            }
            
            // 扩大描述区域
            if (resultDescription) {
                resultDescription.classList.add('full-width-error');
                resultDescription.style.maxWidth = '800px';
                resultDescription.style.margin = '0 auto';
            }
            
            // 禁用下载按钮
            if (downloadResultBtn) {
                downloadResultBtn.disabled = true;
                downloadResultBtn.style.opacity = '0.5';
                downloadResultBtn.style.cursor = 'not-allowed';
            }
            
            // 设置描述内容
            resultDescription.innerHTML = state.processDescription || '';
            
            // 显示结果容器
            resultContainer.hidden = false;
            setTimeout(() => {
                resultContainer.classList.add('show');
                
                // 确保结果内容完全可见
                const resultContent = document.querySelector('.result-content');
                if (resultContent) {
                    resultContent.scrollTop = 0;
                }
            }, 50);
            
            return;
        }
        
        // 重置布局 - 如果之前显示过纯文本，确保图片比较区域可见
        if (resultComparison) {
            resultComparison.style.display = 'flex';
        }
        
        if (resultDescription) {
            resultDescription.classList.remove('full-width-error');
            resultDescription.style.maxWidth = '';
            resultDescription.style.margin = '';
        }
        
        // 启用下载按钮
        if (downloadResultBtn) {
            downloadResultBtn.disabled = false;
            downloadResultBtn.style.opacity = '';
            downloadResultBtn.style.cursor = '';
        }
        
        // 为生成模式特别处理 - 隐藏原始图片区域
        if (state.selectedOperation === 'generate') {
            if (resultOriginal && resultProcessed) {
                // 隐藏原始图片区域
                resultOriginal.style.display = 'none';
                // 让处理后的图片占据全宽
                resultProcessed.classList.add('full-width');
                console.log("生成模式: 隐藏原始图片区域，设置处理后图片为全宽");
            }
        } 
        // 对于其他操作模式，显示原始图片
        else if (hasOriginalImage && originalImage) {
            originalImage.src = URL.createObjectURL(state.uploadedImages[0]);
            
            if (resultOriginal && resultProcessed) {
                resultOriginal.style.display = 'flex';
                resultProcessed.classList.remove('full-width');
                
                // 读取原始图片的尺寸，为两边的容器设置相同的高度
                originalImage.onload = function() {
                    console.log("原始图片加载成功，尺寸:", this.naturalWidth, "x", this.naturalHeight);
                    
                    // 保存原图尺寸信息，如果之前没有设置的话
                    if (!state.originalWidth || !state.originalHeight) {
                        state.originalWidth = this.naturalWidth;
                        state.originalHeight = this.naturalHeight;
                    }
                    
                    // 设置原图的宽高比
                    originalImage.style.aspectRatio = `${state.originalWidth} / ${state.originalHeight}`;
                    
                    // 确保结果显示区域高度足够
                    if (resultComparison) {
                        const minHeight = Math.min(500, Math.max(300, this.naturalHeight / 2));
                        resultComparison.style.minHeight = `${minHeight}px`;
                    }
                };
            }
        } else {
            // 如果没有原始图片，隐藏原始图片区域
            if (resultOriginal && resultProcessed) {
            resultOriginal.style.display = 'none';
            resultProcessed.classList.add('full-width');
            }
        }
        
        // 设置处理后的图片
        if (state.processedImage && processedImage) {
            // 确保处理后的图片URL有效，必须是http开头的URL或数据URL
            if (state.processedImage.startsWith('http') || state.processedImage.startsWith('data:')) {
            processedImage.src = state.processedImage;
            console.log("设置处理后图片URL:", state.processedImage);
            
            // 保持原始图片的宽高比
            if (state.originalWidth && state.originalHeight) {
                // 根据原始尺寸设置样式
                processedImage.style.aspectRatio = `${state.originalWidth} / ${state.originalHeight}`;
                console.log(`设置图片宽高比: ${state.originalWidth} / ${state.originalHeight}`);
                } else if (state.selectedOperation === 'generate') {
                    // 生成模式下默认使用16:9的比例
                    processedImage.style.aspectRatio = "16/9";
                    console.log("生成模式: 设置默认宽高比 16/9");
            }
            
            // 添加图片加载事件，确保图片正确加载
            processedImage.onload = function() {
                console.log("处理后图片加载成功，尺寸:", this.naturalWidth, "x", this.naturalHeight);
                
                // 如果没有原始尺寸信息，使用当前图片的尺寸
                if (!state.originalWidth || !state.originalHeight) {
                    state.originalWidth = this.naturalWidth;
                    state.originalHeight = this.naturalHeight;
                        
                        // 更新宽高比
                        processedImage.style.aspectRatio = `${this.naturalWidth} / ${this.naturalHeight}`;
                    }
                    
                    // 更新下载按钮，关联当前图片
                    if (downloadResultBtn) {
                        downloadResultBtn.onclick = function() {
                            downloadProcessedImage();
                        };
                        downloadResultBtn.disabled = false;
                    }
                };
                
                // 处理加载失败的情况
            processedImage.onerror = function() {
                console.error("处理后图片加载失败:", state.processedImage);
                    
                    // 显示错误信息，并设置备选图像
                    processedImage.src = 'assets/examples/error.jpg';
                    processedImage.alt = '图片加载失败';
                    
                    // 更新描述
                if (resultDescription) {
                        let errorHtml = `<div class="error-message">
                            <strong>图片加载失败</strong>
                            <p>无法加载处理后的图片，请检查URL是否有效：${state.processedImage}</p>
                            <p>如果有任务ID和生成ID，您可以尝试直接访问：</p>
                        </div>`;
                        
                        if (state.taskId && state.genId) {
                            const directUrl = `https://videoopenai.filesystem.site/vg-assets/assets/${state.taskId}/${state.genId}.png`;
                            errorHtml += `<div class="direct-link"><a href="${directUrl}" target="_blank">直接访问图片</a></div>`;
                        }
                        
                        resultDescription.innerHTML = errorHtml + (resultDescription.innerHTML || '');
                    }
                    
                    // 禁用下载按钮
                    if (downloadResultBtn) {
                        downloadResultBtn.disabled = true;
                    }
                };
            } else {
                console.error("处理后图片URL无效:", state.processedImage);
                
                // 显示错误
                processedImage.src = 'assets/examples/error.jpg';
                processedImage.alt = '图片URL无效';
                
                // 更新描述
                if (resultDescription) {
                    const errorHtml = `<div class="error-message">
                        <strong>图片URL无效</strong>
                        <p>系统返回的图片URL格式不正确：${state.processedImage}</p>
                    </div>`;
                    resultDescription.innerHTML = errorHtml + (resultDescription.innerHTML || '');
                }
                
                // 禁用下载按钮
                if (downloadResultBtn) {
                    downloadResultBtn.disabled = true;
                }
            }
        } else {
            console.warn("没有处理后的图片可显示");
            
            // 如果没有处理后的图片但有错误信息
            if (state.processingStatus === 'error' && state.processDescription) {
                const errorMessage = `<div class="error-message">
                    <strong>处理失败</strong>
                    <p>${state.processDescription}</p>
                </div>`;
                resultDescription.innerHTML = errorMessage;
                
                // 显示一个占位符图像
                processedImage.src = 'assets/examples/error.jpg'; 
                processedImage.alt = '处理失败';
                
                // 禁用下载按钮
                if (downloadResultBtn) {
                    downloadResultBtn.disabled = true;
                }
            }
        }
        
        // 设置描述内容
        let descriptionContent = '';
        
        // 添加操作类型标签
        if (state.processingStatus === 'error') {
            descriptionContent += '<span class="operation-tag error">处理出错</span>';
        } else {
            switch(state.selectedOperation) {
                case 'generate':
                    descriptionContent += '<span class="operation-tag generate">一句话生成美图</span>';
                    break;
                case 'style':
                    descriptionContent += '<span class="operation-tag style">风格转换</span>';
                    break;
                case 'creative':
                    descriptionContent += '<span class="operation-tag creative">创意生成</span>';
                    break;
                default:
                    descriptionContent += '<span class="operation-tag">图像处理</span>';
            }
        }
        
        // 添加处理描述
        descriptionContent += state.processDescription || '';
        resultDescription.innerHTML = descriptionContent;
        
        // 显示结果容器
        resultContainer.hidden = false;
        
        // 稍微延迟显示，让浏览器有时间计算布局
        setTimeout(() => {
            resultContainer.classList.add('show');
            
            // 确保结果内容完全可见
            const resultContent = document.querySelector('.result-content');
            if (resultContent) {
                resultContent.scrollTop = 0;
            }
        }, 50);
    } catch (error) {
        console.error("显示结果视图时出错:", error);
        showToast("显示结果时出错: " + error.message, "error");
    }
}

/**
 * 重置全部状态，准备新的处理
 */
function resetState() {
    // 重置所有状态变量
    state.currentStep = 1;
    state.uploadedImages = [];
            state.selectedOperation = null;
    state.textDescription = '';
            state.selectedStyle = null;
            state.customInstruction = '';
    state.processedResult = null;
    state.requiresImage = false;
    state.imageOptional = false;
    
    // 重置UI状态
    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
        indicator.classList.remove('active', 'complete');
        if (index === 0) {
            indicator.classList.add('active');
        }
    });
    
    document.querySelectorAll('.step-connector').forEach(connector => {
        connector.classList.remove('half', 'complete');
    });
    
    document.querySelectorAll('.step-content').forEach((content, index) => {
        content.classList.remove('active');
        if (index === 0) {
            content.classList.add('active');
        }
    });
    
    // 重置选择状态
    document.querySelectorAll('.operation-option, .style-option, .creative-style-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // 重置图片上传
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
        const uploadInner = uploadArea.querySelector('.upload-inner');
        if (uploadInner) uploadInner.style.display = 'block';
    }
    
    const imagePreview = document.getElementById('image-preview');
    if (imagePreview) {
        imagePreview.hidden = true;
        // 确保预览图片也被清空
        const previewImage = document.getElementById('preview-image');
        if (previewImage) previewImage.src = '';
    }
    
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';
    
    // 重置文字描述
    const imageDescription = document.getElementById('image-description');
    if (imageDescription) imageDescription.value = '';
    
    // 重置自定义指令
    const customInstruction = document.getElementById('custom-instruction');
    if (customInstruction) customInstruction.value = '';
    
    // 禁用下一步按钮
    const nextToStep2Btn = document.getElementById('next-to-step2');
    if (nextToStep2Btn) nextToStep2Btn.disabled = true;
    
    const nextToStep3Btn = document.getElementById('next-to-step3');
    if (nextToStep3Btn) nextToStep3Btn.disabled = true;
    
    // 恢复步骤3标题到默认值
    const step3Indicator = document.querySelector('.step-indicator[data-step="3"]');
    if (step3Indicator) {
        const step3Name = step3Indicator.querySelector('.step-name');
        const step3Desc = step3Indicator.querySelector('.step-desc');
        
        if (step3Name) step3Name.textContent = '选择风格';
        if (step3Desc) step3Desc.textContent = '指定转换风格';
    }
}

/**
 * 显示提示消息
 * @param {string} message - 要显示的消息
 * @param {string} type - 消息类型：success, warning, error
 * @param {number} duration - 显示持续时间（毫秒），默认3000毫秒
 */
function showToast(message, type = 'success', duration = 3000) {
    const toast = document.getElementById('toast-message');
    
    // 设置消息内容
    toast.textContent = message;
    
    // 清除旧的类型类
    toast.classList.remove('success', 'warning', 'error');
    
    // 添加类型类
    toast.classList.add(type);
    
    // 显示提示
    toast.classList.add('show');
    
    // 错误和警告消息默认显示时间更长
    if (type === 'error' && duration === 3000) {
        duration = 5000; // 错误消息默认5秒
    } else if (type === 'warning' && duration === 3000) {
        duration = 4000; // 警告消息默认4秒
    }
    
    // 设置自动隐藏
    clearTimeout(toast.timeout); // 清除之前的定时器
    toast.timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

/**
 * 简单格式化Markdown文本为HTML
 * @param {string} text - 包含markdown标记的文本
 * @returns {string} 格式化后的HTML
 */
function formatMarkdown(text) {
    if (!text) return '';
    
    // 移除可能包含的图片markdown标记（已在API中处理）
    text = text.replace(/!\[.*?\]\(https?:\/\/[^)]+\)/g, '');
    
    // 处理粗体
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 处理斜体
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // 处理代码块
    text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // 处理行内代码
    text = text.replace(/`(.*?)`/g, '<code>$1</code>');
    
    return text;
}

/**
 * 初始化结果查看功能
 */
function initResultViewer() {
    const resultContainer = document.getElementById('result-container');
    const closeResultBtn = document.getElementById('close-result-btn');
    const downloadResultBtn = document.getElementById('download-result-btn');
    const retryBtn = document.getElementById('retry-btn');
    const originalImage = document.getElementById('original-image');
    const processedImage = document.getElementById('processed-image');
    
    // 关闭结果弹窗
    closeResultBtn.addEventListener('click', function() {
        resultContainer.classList.remove('show');
        setTimeout(() => {
            resultContainer.hidden = true;
        }, 300);
    });
    
    // 下载结果
    downloadResultBtn.addEventListener('click', function() {
        try {
            if (state.processedImage) {
                console.log("开始下载图片:", state.processedImage);
                
                // 获取已加载的图片元素
                const imgElement = document.getElementById('processed-image');
                
                // 如果图片尚未加载完成，提示用户等待
                if (!imgElement.complete || !imgElement.naturalWidth) {
                    showToast('图片正在加载中，请稍候再试', 'warning');
                    return;
                }
                
                // 根据图片来源处理下载方式
                if (state.processedImage.startsWith('data:')) {
                    // 如果是base64格式，直接下载
                    const link = document.createElement('a');
                    link.href = state.processedImage;
                    link.download = `processed-image-${new Date().getTime()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showToast('图片下载已开始', 'success');
                }
                else if (state.processedImage.startsWith('http')) {
                    // 对于远程URL，创建一个Canvas元素绘制图片，再导出为DataURL下载
                    // 这样可以避免跨域问题
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // 设置Canvas尺寸为图片实际尺寸
                    canvas.width = imgElement.naturalWidth;
                    canvas.height = imgElement.naturalHeight;
                    
                    // 绘制图片到Canvas
                    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
                    
                    // 尝试导出为图片
                    try {
                        const dataUrl = canvas.toDataURL('image/png');
                        
                        // 创建下载链接
                        const link = document.createElement('a');
                        link.href = dataUrl;
                        
                        // 从URL中提取文件名
                        let fileName = 'processed-image';
                        const urlParts = state.processedImage.split('/');
                        const possibleFileName = urlParts[urlParts.length - 1];
                        
                        // 如果URL末尾部分看起来像文件名，使用它
                        if (possibleFileName && possibleFileName.includes('.')) {
                            fileName = possibleFileName;
                        } else {
                            fileName = `${fileName}-${new Date().getTime()}.png`;
                        }
                        
                        link.download = fileName;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
                        showToast('图片下载已开始', 'success');
                    } catch (canvasError) {
                        console.error('Canvas导出图片失败:', canvasError);
                        
                        // 如果Canvas导出失败，尝试直接打开图片URL
                        showToast('直接下载失败，将在新窗口打开图片', 'warning');
                        window.open(state.processedImage, '_blank');
                    }
                } else {
                    // 对于本地文件路径
                    console.log("尝试下载本地图片:", state.processedImage);
                    
                    // 创建下载链接
                    const link = document.createElement('a');
                    link.href = state.processedImage;
                    
                    // 从路径中提取文件名
                    const pathParts = state.processedImage.split('/');
                    const fileName = pathParts[pathParts.length - 1] || `processed-image-${new Date().getTime()}.jpg`;
                    
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    showToast('图片下载已开始', 'success');
                }
            } else {
                showToast('下载失败，未找到处理后的图片', 'error');
            }
        } catch (error) {
            console.error('图片下载失败:', error);
            showToast(`下载失败: ${error.message}`, 'error', 5000);
            
            // 如果下载失败，尝试在新窗口打开图片
            if (state.processedImage && state.processedImage.startsWith('http')) {
                setTimeout(() => {
                    if (confirm('下载失败，是否在新窗口打开图片？')) {
                        window.open(state.processedImage, '_blank');
                    }
                }, 1000);
            }
        }
    });
    
    // 重新处理
    retryBtn.addEventListener('click', function() {
        // 隐藏结果
        resultContainer.classList.remove('show');
        setTimeout(() => {
            resultContainer.hidden = true;
            
            // 根据当前操作类型重置到相应步骤
            if (state.selectedOperation === 'style') {
                // 风格转换 - 回到选择风格步骤
                goToStep(3);
            } else {
                // 其他操作 - 回到图片处理步骤
                goToStep(2);
            }
        }, 300);
    });
}

/**
 * 处理API调用失败
 * @param {string} operation - 操作类型
 * @param {string} originalImageSrc - 原始图片URL
 */
async function handleApiFailure(operation, originalImageSrc) {
    console.log("API调用失败，显示错误信息");
    
    // 隐藏加载指示器，确保不会一直显示加载中
    hideLoadingIndicator();
    
    // 先检查是否有延迟响应
    try {
        console.log("检查是否有延迟响应...");
        
    const delayedResponse = await window.API.checkDelayedResponse();
        
        if (delayedResponse && delayedResponse.imageUrl) {
        console.log("在handleApiFailure中发现延迟响应:", delayedResponse);
        
            // 使用延迟响应，而不是显示错误
        showResultView({
            type: 'text_and_image',
            content: delayedResponse.content || '处理完成（延迟响应）',
            imageUrl: delayedResponse.imageUrl,
            status: 'success',
            originalImage: originalImageSrc,
            originalWidth: delayedResponse.originalWidth,
            originalHeight: delayedResponse.originalHeight
        });
        
        // 隐藏加载指示器
        hideLoadingIndicator();
        
        // 显示提示
        showToast('处理成功（延迟响应）', 'success');
        
            return; // 直接返回，不显示错误信息
        } else {
            console.log("没有找到延迟响应或响应不包含图片，显示错误信息");
        }
    } catch (error) {
        console.error("检查延迟响应时出错:", error);
    }
    
    // 创建友好的错误消息
    let errorMessage = `
        <div class="error-view">
            <div class="error-icon">
                <span class="material-symbols-rounded">error_outline</span>
            </div>
            <h3>图像处理未成功</h3>
            <p>在${getOperationName(operation)}过程中遇到了问题。以下是可能的解决方案：</p>
            <ul class="error-suggestions">
                <li>检查您的网络连接是否稳定</li>
                <li>稍后再试，服务器可能暂时繁忙</li>
                <li>尝试使用不同的描述或风格</li>
                <li>尝试使用不同的图片（分辨率较低的图片处理速度可能更快）</li>
            </ul>
            <div class="error-actions">
                <button id="retry-error-btn" class="btn primary-btn">
                    <span class="material-symbols-rounded">refresh</span>
                    重试
                </button>
                <button id="back-error-btn" class="btn secondary-btn">
                    <span class="material-symbols-rounded">arrow_back</span>
                    返回修改
                </button>
            </div>
        </div>
    `;
    
    // 显示处理结果，包含错误消息和原始图片
    showResultView({
        type: 'text',
        content: errorMessage,
        status: 'error',
        originalImage: originalImageSrc
    });
    
    // 为错误视图中的按钮添加事件监听器
    setTimeout(() => {
        const retryErrorBtn = document.getElementById('retry-error-btn');
        const backErrorBtn = document.getElementById('back-error-btn');
        
        if (retryErrorBtn) {
            retryErrorBtn.addEventListener('click', () => {
                // 根据操作类型重新处理
                if (operation === 'style' && (state.selectedStyle || state.customStyleInstruction)) {
                    startProcessStyle();
                } else if (operation === 'generate' && state.textDescription) {
                    startProcessGenerate();
                } else if (operation === 'creative') {
                    // 创意生成处理
                    startProcessCreative();
                } else {
                    // 返回到输入界面
                    showInputView();
                }
            });
        }
        
        if (backErrorBtn) {
            backErrorBtn.addEventListener('click', () => {
                // 返回到上一步
                if (operation === 'style') {
                    goToStep(3); // 返回风格选择
                } else if (operation === 'generate') {
                    goToStep(2); // 返回文字描述
                } else {
                    goToStep(1); // 返回操作选择
                }
            });
        }
    }, 100);
    
    // 显示错误提示
    showToast('图像处理失败，请稍后重试', 'error');
}

/**
 * 根据操作类型获取操作名称
 * @param {string} operation - 操作类型
 * @returns {string} - 操作名称
 */
function getOperationName(operation) {
    switch(operation) {
        case 'style': return '风格转换';
        case 'generate': return '一句话生成美图';
        case 'creative': return '创意生成';
        default: return '图像处理';
    }
}

/**
 * 下载远程图片
 * @param {string} url - 远程图片URL
 */
async function downloadRemoteImage(url) {
    try {
        showToast('正在下载图片...', 'success');
        
        // 检查是否是来自videoopenai.filesystem.site的URL (yunwu.ai使用的服务)
        const isYunwuSite = url.includes('videoopenai.filesystem.site') || 
                            url.includes('filesystem.site');
        
        let blob;
        if (isYunwuSite) {
            // 对于yunwu.ai的图片URL，使用特殊处理以避免可能的CORS问题
            console.log("处理yunwu.ai图片下载:", url);
            
            try {
                // 创建下载请求，带上适当的请求头
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'image/*, */*',
                        'Referer': 'https://yunwu.ai/',
                        'Origin': window.location.origin
                    },
                    mode: 'cors',
                    cache: 'no-cache'
                });
                
                if (response.ok) {
                    blob = await response.blob();
                } else {
                    throw new Error(`获取图片失败: ${response.status}`);
                }
            } catch (corsError) {
                console.warn("直接获取图片失败，可能存在CORS问题:", corsError);
                
                // 尝试构建替代URL
                let alternativeUrl = null;
                
                // 如果有state中的taskId和genId，可以尝试使用不同的格式
                if (state.taskId && state.genId) {
                    const formats = [
                        `https://videoopenai.filesystem.site/vg-assets/assets/${state.taskId}/${state.genId}.png`,
                        `https://videoopenai.filesystem.site/vg-assets/assets%2F${state.taskId}%2F${state.genId}.png`
                    ];
                    
                    // 如果当前URL与构建的URL相同，那么就不再尝试
                    if (formats[0] !== url && formats[1] !== url) {
                        alternativeUrl = formats[0]; // 尝试第一种格式
                        
                        try {
                            const altResponse = await fetch(alternativeUrl, {
                                method: 'GET',
                                headers: {
                                    'Accept': 'image/*, */*',
                                    'Referer': 'https://yunwu.ai/',
                                    'Origin': window.location.origin
                                },
                                mode: 'cors',
                                cache: 'no-cache'
                            });
                            
                            if (altResponse.ok) {
                                blob = await altResponse.blob();
                                console.log("使用替代URL成功获取图片:", alternativeUrl);
                            } else {
                                throw new Error(`使用替代URL获取图片失败: ${altResponse.status}`);
                            }
                        } catch (altError) {
                            console.warn("使用替代URL获取图片失败:", altError);
                
                // 提示用户手动下载
                            const message = '由于跨域限制，无法自动下载图片。请右键点击图片，选择"图片另存为..."进行下载，或点击下方显示的直接链接。';
                            showToast(message, 'warning', 8000);
                
                // 打开图片在新标签页
                window.open(url, '_blank');
                            
                            // 在结果描述中添加直接链接
                            const resultDescription = document.getElementById('result-description');
                            if (resultDescription) {
                                // 检查是否已经添加了链接区域
                                if (!resultDescription.querySelector('.direct-link')) {
                                    const linksHtml = `
                                        <div class="direct-link">
                                            <p>您可以尝试以下直接链接下载图片：</p>
                                            <a href="${url}" target="_blank">链接1</a>
                                            <a href="${alternativeUrl}" target="_blank">链接2</a>
                                        </div>
                                    `;
                                    resultDescription.innerHTML += linksHtml;
                                }
                            }
                            
                return;
                        }
                    }
                }
                
                if (!blob) {
                    // 如果仍然没有blob，提示用户
                    showToast('由于跨域限制，无法自动下载图片。请右键点击图片，选择"图片另存为..."进行下载', 'warning', 8000);
                    window.open(url, '_blank');
                    return;
                }
            }
        } else {
            // 其他普通URL的处理
            try {
            // 使用fetch获取图片数据
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`获取图片失败: ${response.status}`);
            }
            blob = await response.blob();
            } catch (error) {
                console.error("获取图片失败:", error);
                showToast('下载图片失败，请右键图片另存为', 'error');
                window.open(url, '_blank');
                return;
            }
        }
        
        // 创建一个临时链接下载blob
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        
        // 从URL获取文件名或使用默认名称
        let filename = 'yunwu_image.png';
        
        // 尝试从URL中提取gen_id和task_id作为文件名
        if (isYunwuSite) {
            // 尝试从URL中提取gen_id
            const genIdMatch = url.match(/\/(gen_[a-z0-9]+)\.png/);
            if (genIdMatch && genIdMatch[1]) {
                filename = `yunwu_${genIdMatch[1]}.png`;
            } else if (state.taskId && state.genId) {
                // 使用state中存储的ID
                filename = `yunwu_${state.genId}.png`;
            } else {
                // 使用时间戳
                filename = `yunwu_image_${new Date().getTime()}.png`;
            }
        } else {
            // 一般URL的文件名处理
            const urlParts = url.split('/');
            if (urlParts.length > 0) {
                const possibleFilename = urlParts[urlParts.length - 1].split('?')[0];
                if (possibleFilename && possibleFilename.includes('.')) {
                    filename = possibleFilename;
                }
            }
        }
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 清理URL对象
        setTimeout(() => URL.revokeObjectURL(link.href), 100);
        
        showToast('图片下载成功！', 'success');
    } catch (error) {
        console.error('下载图片失败:', error);
        showToast('下载图片失败，请重试或右键图片另存为', 'error');
        
        // 尝试打开图片在新标签页，让用户手动保存
        try {
            window.open(url, '_blank');
        } catch (e) {
            console.error('无法打开图片URL在新标签页:', e);
        }
    }
} 

/**
 * 初始化图片上传功能
 * 注意：此功能现已由ui.js中的同名函数实现，本函数仅作为兼容性保留
 */
function initImageUpload() {
    console.log("process.js中的initImageUpload函数已被ui.js替代，为避免冲突不执行实际操作");
    // 保留空实现以避免可能的引用错误
    return;
}

/**
 * 更新步骤3的UI，根据操作类型显示不同内容
 */
function updateStep3UI() {
    console.log(`更新步骤3 UI - 当前操作类型: ${state.selectedOperation}`);
    
    // 获取步骤3的标题和描述元素
    const stepTitle = document.querySelector('#step-3 .step-title');
    const stepDesc = document.querySelector('#step-3 .step-description');
    const styleOptions = document.querySelector('.style-options');
    const advancedStyleOptions = document.querySelector('.advanced-style-options');
    const styleCustomizationArea = document.getElementById('style-customization-area');
    
    // 进行非空检查，避免空引用错误
    if (!styleOptions || !advancedStyleOptions) {
        console.error('未找到风格选项元素');
        return;
    }
    
    // 移动文字描述区域到步骤3（如果需要）
    const textDescriptionArea = document.getElementById('text-description-area');
    if (textDescriptionArea) {
        // 当操作类型为创意生成或一句话生成模式时，将文字描述区域移动到步骤3
        if (state.selectedOperation === 'creative' || state.selectedOperation === 'generate') {
            // 保存原始文字描述
            const originalDescription = document.getElementById('image-description').value;
            
            // 将文字描述区域移动到步骤3的合适位置
            const step3Content = document.getElementById('step-3');
            if (step3Content) {
                // 首先检查文字描述区域是否已经在步骤3中
                const existingDescArea = step3Content.querySelector('#text-description-area');
                if (!existingDescArea) {
                    // 对于创意生成，将文字描述区域放在高级风格选项后面
                    if (state.selectedOperation === 'creative') {
                        if (advancedStyleOptions && advancedStyleOptions.nextSibling) {
                            step3Content.insertBefore(textDescriptionArea, advancedStyleOptions.nextSibling);
                        } else {
                            // 如果高级风格选项是最后一个元素，就添加到末尾
                            step3Content.appendChild(textDescriptionArea);
                        }
                    } else {
                        // 对于一句话生成，放在开头
                        step3Content.insertBefore(textDescriptionArea, step3Content.firstChild.nextSibling.nextSibling);
                    }
                    
                    textDescriptionArea.style.display = 'block';
                    
                    // 更新文字描述区域的标题和提示文本
                    if (state.selectedOperation === 'creative') {
                        const descTitle = textDescriptionArea.querySelector('.description-title');
                        if (descTitle) {
                            descTitle.textContent = '补充创意描述和自定义指令';
                        }
                        
                        const descHint = textDescriptionArea.querySelector('.description-hint');
                        if (descHint) {
                            descHint.textContent = '选择创意风格后将自动添加创意指令，您可根据需要修改';
                        }
                    }
                    
                    // 恢复已输入的文字描述
                    document.getElementById('image-description').value = originalDescription;
                } else {
                    // 如果已经存在，只需显示它
                    existingDescArea.style.display = 'block';
                }
            }
        }
    }
    
    // 根据操作类型显示不同内容
    if (state.selectedOperation === 'style') {
        // 显示常规风格选项，隐藏高级创意风格
        styleOptions.style.display = 'grid';
        advancedStyleOptions.style.display = 'none';
        if (stepTitle) stepTitle.textContent = '选择风格';
        if (stepDesc) stepDesc.textContent = '选择您想要转换成的艺术风格';
        
        // 显示自定义风格指令区域
        if (styleCustomizationArea) {
            styleCustomizationArea.style.display = 'block';
        }
        
        // 隐藏文字描述区域（如果存在）
        if (textDescriptionArea) {
            textDescriptionArea.style.display = 'none';
        }
    } else if (state.selectedOperation === 'creative') {
        // 隐藏常规风格选项，显示高级创意风格
        styleOptions.style.display = 'none';
        advancedStyleOptions.style.display = 'block';
        
        // 隐藏自定义风格指令区域
        if (styleCustomizationArea) {
            styleCustomizationArea.style.display = 'none';
        }
        
        if (stepTitle) stepTitle.textContent = '选择创意模式';
        if (stepDesc) stepDesc.textContent = '选择一种高阶创意风格，系统将自动生成对应提示词';
        
        // 修改高级风格选项标题和描述
        const advancedOptionsTitle = advancedStyleOptions.querySelector('.advanced-options-title');
        const advancedOptionsDesc = advancedStyleOptions.querySelector('.advanced-options-desc');
        
        if (advancedOptionsTitle) {
            advancedOptionsTitle.textContent = '创意风格选择';
        }
        
        if (advancedOptionsDesc) {
            advancedOptionsDesc.textContent = '选择以下创意风格之一，系统将根据您的上传图片生成创意效果';
        }
    } else {
        // 默认显示所有风格选项
        styleOptions.style.display = 'grid';
        advancedStyleOptions.style.display = 'block';
        if (stepTitle) stepTitle.textContent = '选择效果';
        if (stepDesc) stepDesc.textContent = '选择您想要的生成效果并添加详细描述';
    }
    
    // 检查是否预设了风格
    if (state.presetStyle && !state.selectedStyle) {
        const styleSelector = state.selectedOperation === 'style' 
            ? `.style-option[data-style="${state.presetStyle}"]`
            : `.creative-style-option[data-style="${state.presetStyle}"]`;
        
        const styleOption = document.querySelector(styleSelector);
        if (styleOption) {
            styleOption.click();
        }
    }
}