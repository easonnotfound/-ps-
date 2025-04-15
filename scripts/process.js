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
    retryCount: 0,
    textDescription: '',
    customInstruction: '',
    processedImage: null,
    processDescription: '',
    processingStatus: 'idle',
    taskId: null,
    genId: null,
    originalWidth: null,
    originalHeight: null,
    lastApiResponse: null, // 添加最后一次API响应存储
    processingError: null // 添加处理错误存储
};

// 添加示例提示词对象
// 用于在不同操作模式下提供示例提示词
const examplePrompts = {
    'generate': [
        '绘制一个梦幻般的仙境花园，有七彩瀑布、巨大的蘑菇和飞舞的萤火虫，使用梦幻般的色彩和细节',
        '画一只可爱的橙色猫咪坐在窗台上，看着窗外的雨景，背景是模糊的城市天际线，整体画面温暖文艺',
        '一条宁静的乡间小路，两旁是金色麦田，远处有山脉和日落，天空呈现紫红色的晚霞，画面有印象派的感觉',
        '展示一个未来主义城市空中花园，悬浮的平台上种满各种外星植物，有玻璃天桥连接，背景是繁忙的飞行器交通',
        '创建一个神秘的古老图书馆内部场景，高耸的书架直达天花板，有魔法般的浮动书本和发光的尘埃粒子'
    ],
    'style': [
        '将图片转换为宫崎骏动画风格，保持画面温暖柔和',
        '将图片转换为梵高星空风格，添加漩涡状笔触和鲜艳对比色',
        '将图片转换为低多边形几何风格，保持图像轮廓清晰',
        '将图片转换为霓虹赛博朋克风格，加入强烈的蓝紫色调和光影效果',
        '将图片转换为水墨国画风格，保留细节但增加水墨晕染效果'
    ],
    'creative': [
        '以这张图片为基础，创建一幅科幻电影海报，添加未来感字体和元素',
        '创建一个四格漫画，以图片中的主体为主角，展示一个有趣的日常故事',
        '将图片变成厚白边透明背景的卡通贴纸风格，增加可爱元素',
        '以图片为基础创建一个复古电视机效果，加入故障艺术风格',
        '创建一个全景环绕效果，把图片主体放在一个微缩宇宙中'
    ]
};

// 确保在全局window对象上也有该状态
window.state = state;

/**
 * 检查并启用下一步按钮
 * 确保根据当前步骤的完成情况正确地激活或禁用下一步按钮
 */
function checkAndEnableNextButton() {
    console.log(`处理模块: 检查步骤 ${window.state.currentStep} 的按钮状态`);
    
    // 获取对应的下一步按钮元素
    const currentStepButtonId = `next-to-step${Number(window.state.currentStep) + 2}`;
    const nextButton = document.getElementById(currentStepButtonId);
    
    if (nextButton) {
        console.log(`找到按钮: ${currentStepButtonId}, 当前状态: ${nextButton.disabled ? '禁用' : '启用'}`);
    } else {
        console.log(`未找到按钮: ${currentStepButtonId}`);
        return; // 如果找不到按钮元素，则退出函数
    }
    
    let shouldEnable = false;
    
    // 根据当前步骤判断是否应该启用按钮
    switch (window.state.currentStep) {
        case 1: // 图片上传步骤
            // 直接检查全局uploadedImages数组
            if (window.uploadedImages && window.uploadedImages.length > 0) {
                console.log(`已上传图片: true，数量: ${window.uploadedImages.length}`);
                shouldEnable = true;
            } else if (window.state.uploadedImages && window.state.uploadedImages.length > 0) {
                console.log(`state中有上传图片: true，数量: ${window.state.uploadedImages.length}`);
                shouldEnable = true;
            } else if (document.querySelectorAll('.image-preview-item').length > 0) {
                console.log(`DOM中找到图片预览元素，数量: ${document.querySelectorAll('.image-preview-item').length}`);
                shouldEnable = true;
            } else {
                console.log('未检测到已上传图片，禁用下一步按钮');
            }
            break;
            
        case 2: // 选择操作步骤
            if (window.state.selectedOperation) {
                shouldEnable = true;
            }
            break;
            
        // 其他步骤的按钮启用逻辑
        default:
            shouldEnable = true;
            break;
    }
    
    // 更新按钮状态
    if (shouldEnable) {
        nextButton.disabled = false;
        nextButton.classList.add('active');
        console.log(`已启用按钮: ${currentStepButtonId}`);
    } else {
        nextButton.disabled = true;
        nextButton.classList.remove('active');
        console.log(`已禁用按钮: ${currentStepButtonId}`);
    }
    
    // 如果已标记图片上传更新，检测所有下一步按钮
    if (window.uploadedImagesUpdated && window.state.currentStep === 1) {
        console.log('检测到uploadedImagesUpdated标志，更新所有下一步按钮');
        const allNextButtons = document.querySelectorAll('.next-btn');
        if (allNextButtons.length > 0) {
            allNextButtons.forEach(btn => {
                btn.disabled = false;
                btn.classList.add('active');
            });
        }
    }
}

/**
 * 更新按钮状态
 * @param {HTMLElement} button - 要更新的按钮元素
 */
function updateButtonState(button) {
    if (!button) return;
    
    // 确保全局状态存在
    if (!window.uploadedImages) {
        window.uploadedImages = [];
    }
    if (!window.state) {
        window.state = {
            uploadedImages: window.uploadedImages,
            instruction: ''
        };
    }
    
    // 统一使用全局上传数组
    if (window.state.uploadedImages && window.state.uploadedImages.length > 0) {
        // 确保全局数组与state同步
        window.uploadedImages = window.state.uploadedImages;
    } else if (window.uploadedImages && window.uploadedImages.length > 0) {
        // 确保state与全局数组同步
        window.state.uploadedImages = window.uploadedImages;
    }
    
    // 获取已上传图片
    const hasUploadedImages = window.uploadedImages && window.uploadedImages.length > 0;
    
    // 获取文本输入
    const hasInputText = document.getElementById('image-description') && 
                        document.getElementById('image-description').value.trim().length > 0;
    
    // 检查是否是步骤2的按钮（前往步骤3）
    const isStep2Button = button.id === 'next-to-step3';
    
    if (isStep2Button) {
        // 如果是图片上传步骤，判断是否有图片或文字输入
        const shouldEnable = hasUploadedImages || hasInputText;
        
        // 设置按钮状态
        button.disabled = !shouldEnable;
        
        if (shouldEnable) {
            button.classList.add('active');
            console.log('已启用按钮:', button.id || '无ID');
        } else {
            button.classList.remove('active');
            console.log('已禁用按钮:', button.id || '无ID');
        }
    } else {
        // 对于其他步骤的按钮，直接根据全局状态启用
        const shouldEnable = window.state && window.state.currentStep > 0;
        button.disabled = !shouldEnable;
        
        if (shouldEnable) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    }
}

window.checkAndEnableNextButton = checkAndEnableNextButton;

/**
 * 处理图片和指令
 */
async function processImageWithInstruction() {
    try {
        console.log("开始处理图片和指令");
        
        // 获取当前操作类型
        const operation = window.state.selectedOperation;
        if (!operation) {
            throw new Error("未选择操作类型");
        }

        console.log("处理指令:", window.state);
        
        // 获取图片文件（如果有的话）
        let imageFile = null;
        if (operation !== 'generate') {
            // 如果不是生成操作，需要获取图片
            if (window.state.uploadedImages && window.state.uploadedImages.length > 0) {
                imageFile = window.state.uploadedImages[0]; // 使用第一张上传的图片
                console.log("将发送图片到API:", imageFile.name);
    } else {
                throw new Error("未上传图片，无法进行操作");
            }
        }
        
        // 获取指令文本
        let instruction = '';
        
        if (operation === 'generate') {
            // 生成操作使用文字描述
            instruction = window.state.imageDescription;
            if (!instruction) {
                throw new Error("未输入图片描述，无法生成图片");
            }
        } else if (operation === 'style') {
            // 风格转换操作
            const selectedStyle = window.state.selectedStyle;
            const customInstruction = window.state.styleInstruction;
            
            if (customInstruction) {
                // 如果有自定义指令，优先使用
                instruction = customInstruction;
            } else if (selectedStyle) {
                // 否则使用预设风格指令
                instruction = getStyleInstruction(selectedStyle);
            } else {
                throw new Error("未选择风格或输入自定义指令");
            }
        } else if (operation === 'creative') {
            // 创意操作
            const selectedCreative = window.state.selectedCreativeStyle;
            const customInstruction = window.state.creativeInstruction;
            
            if (customInstruction) {
                // 如果有自定义指令，优先使用
                instruction = customInstruction;
            } else if (selectedCreative) {
                // 否则使用预设创意指令
                instruction = getCreativeInstruction(selectedCreative);
        } else {
                throw new Error("未选择创意风格或输入自定义指令");
            }
        }
        
        if (!instruction) {
            throw new Error("无法构建处理指令");
        }
        
        // 显示加载指示器
        showLoadingIndicator();
        
        // 创建进度条
        createProgressBar();
        
        // 更新进度条初始状态
        updateProgressBar(10, '正在准备请求...');
        
        // 设置进度更新定时器 - 模拟进度
        let progress = 10;
        const progressInterval = setInterval(() => {
            if (progress < 90) {
                progress += Math.floor(Math.random() * 3) + 1;
                updateProgressBar(progress, '正在处理中...');
            }
        }, 1000);
        
        try {
            // 发送API请求
            console.log("发送API请求，图片文件:", imageFile ? imageFile.name : "无", "指令:", instruction);
            
            // 调用API处理图片和指令
            const response = await window.API.processImageWithInstruction(imageFile, instruction);
            
            // 清除进度更新定时器
            clearInterval(progressInterval);
            
            // 处理API响应
            console.log("API响应:", response);
            
            // 将API响应保存到全局状态，以便可能的重试操作
            window.state.lastApiResponse = response;
            
            // 判断处理是否成功
            const processingSuccess = response && response.status === 'success';
            
            // 更新状态
            window.state.processingSuccess = processingSuccess;
            
            // 如果处理成功并且返回了图片URL
            if (processingSuccess && response.imageUrl) {
                // 保存处理后的图片URL
                window.state.processedImage = response.imageUrl;
                
                // 保存任务ID和生成ID
                window.state.taskId = response.taskId || null;
                window.state.genId = response.genId || null;
                
                // 保存描述文本
                window.state.processDescription = response.content || '处理完成';
                
                // 保存原始尺寸
                window.state.originalWidth = response.originalWidth || null;
                window.state.originalHeight = response.originalHeight || null;
                
                // 更新进度条为完成状态
                updateProgressBar(100, '处理完成!');
            } else {
                // 处理失败情况
                window.state.processDescription = response.content || '处理失败';
                
                // 更新进度条为失败状态
                updateProgressBar(100, '处理失败!', true);
            }
            
            // 显示处理结果
            showResultView({
                type: 'text_and_image',
                content: window.state.processDescription,
                imageUrl: window.state.processedImage,
                status: processingSuccess ? 'success' : 'error',
                originalWidth: window.state.originalWidth,
                originalHeight: window.state.originalHeight,
                taskId: window.state.taskId,
                genId: window.state.genId
            });

        } catch (error) {
            console.error("API处理错误:", error);
            
            // 清除进度更新定时器
            clearInterval(progressInterval);
            
            // 更新进度条为错误状态
            updateProgressBar(100, '处理失败!', true);
            
            // 显示错误信息
            let errorMessage = error.message || '处理请求时出错';
            
            // 更新状态
            window.state.processingSuccess = false;
            window.state.processDescription = errorMessage;
            
            // 创建错误响应对象并保存到状态中
            const errorResponse = {
                type: 'text',
                content: errorMessage,
                status: 'error'
            };
            window.state.lastApiResponse = errorResponse;
            
            // 显示错误结果
            showResultView(errorResponse);
            
            // 尝试处理API失败
            handleApiFailure(operation, window.state.uploadedImageUrl);
        } finally {
            // 隐藏加载指示器
            hideLoadingIndicator();
        }
    } catch (error) {
        console.error("准备处理请求时出错:", error);
        
        // 显示错误消息
        showToast(error.message, 'error');
        
        // 隐藏加载指示器
        hideLoadingIndicator();
    }
}

/**
 * 显示处理结果
 */
function showResultView(response) {
    try {
        console.log("API处理结果:", response);
        
        // 保存响应用于可能的重试
        window.state.lastApiResponse = response;
        
        const resultContainer = document.getElementById('result-container');
        const originalImage = document.getElementById('original-image');
        const processedImage = document.getElementById('processed-image');
        const resultDescription = document.getElementById('result-description');
        const downloadBtn = document.getElementById('download-result-btn');
        const retryBtn = document.getElementById('retry-btn');
        
        if (!resultContainer || !resultDescription) {
            throw new Error("未找到结果容器元素");
        }
        
        // 确保结果容器可见 - 移除hidden属性并添加show类
        resultContainer.removeAttribute('hidden');
        resultContainer.classList.add('show');
        
        console.log("结果容器已设置为可见:", resultContainer);
        
        // 初始启用重试按钮
        if (retryBtn) {
            retryBtn.disabled = false;
            retryBtn.style.display = 'flex';
        }
        
        // 根据操作类型决定显示内容
        const operation = window.state.selectedOperation;
        const isGenerateOperation = operation === 'generate';
        
        // 设置原始图片区域的显示状态
        const originalImageContainer = document.querySelector('.result-original');
        if (originalImageContainer) {
            originalImageContainer.style.display = isGenerateOperation ? 'none' : 'block';
        }
        
        // 设置处理后图片容器的样式
        const processedImageContainer = document.querySelector('.result-processed');
        if (processedImageContainer) {
            processedImageContainer.className = `result-processed${isGenerateOperation ? ' full-width' : ''}`;
        }
        
        // 检查是否有图片URL，没有则视为错误状态
        if (response.type === 'text_and_image' && !response.imageUrl) {
            console.warn("没有找到图片URL，将响应视为错误状态");
            response.status = 'error';
            response.type = 'text';
            
            // 检查是否有特殊错误类型
            if (!response.errorType) {
                if (response.content && (response.content.includes('生成失败') || response.content.includes('❌'))) {
                    response.errorType = 'generation_failed';
                }
            }
        }
        
        // 处理错误响应
        if (response.status === 'error') {
            let errorContent = response.content || '处理出错';
            
            // 根据错误类型提供不同的提示信息
            if (response.errorType === 'generation_failed') {
                errorContent = `
                    <div class="error-message">
                        <strong>图像生成失败</strong>
                        <p>${response.content || '服务器无法生成图像，请稍后重试。'}</p>
                        <p>可能的原因：</p>
                        <ul>
                            <li>服务器资源暂时不足</li>
                            <li>图像内容可能不符合生成要求</li>
                            <li>处理过程中出现技术问题</li>
                        </ul>
                        <p>您可以点击下方的"重新处理"按钮重试。</p>
                    </div>
                `;
            } else {
                errorContent = `
                    <div class="error-message">
                        <strong>处理出错</strong>
                        <p>${errorContent}</p>
                        <p>您可以点击下方的"重新处理"按钮重试。</p>
                    </div>
                `;
            }
            
            // 显示错误信息
            resultDescription.innerHTML = errorContent;
            
            // 禁用下载按钮
            if (downloadBtn) {
                downloadBtn.disabled = true;
                downloadBtn.style.opacity = 0.5;
            }
            
            // 确保重试按钮可用
            if (retryBtn) {
                retryBtn.style.display = 'flex';
                retryBtn.disabled = false;
            }
            
            // 清空图片显示
            if (processedImage) {
                processedImage.src = '';
            }
            } else {
            // 成功响应处理
            if (response.type === 'text_and_image') {
                // 设置原始图片（如果有的话）
                if (originalImage) {
                    const originalImageSrc = window.state.uploadedImageUrl;
                    if (originalImageSrc && !isGenerateOperation) {
                        originalImage.src = originalImageSrc;
                        console.log("设置原始图片:", originalImageSrc);
                        
                        // 确保原始图片容器可见
                        const originalImageContainer = document.querySelector('.result-original');
                        if (originalImageContainer) {
                            originalImageContainer.style.display = 'block';
                        }
                    } else {
                        // 生成操作没有原始图片，隐藏原始图片容器
                        const originalImageContainer = document.querySelector('.result-original');
                        if (originalImageContainer) {
                            originalImageContainer.style.display = 'none';
                        }
                    }
                }
                
                // 设置处理后的图片
                if (processedImage && response.imageUrl) {
                    processedImage.src = response.imageUrl;
                    console.log("设置处理后图片:", response.imageUrl);
                    
                    // 保存图片URL到state以便下载
                    window.state.processedImage = response.imageUrl;
                    
                    // 确保处理后图片容器可见
                    const processedImageContainer = document.querySelector('.result-processed');
                    if (processedImageContainer) {
                        processedImageContainer.style.display = 'block';
                    }
                    
                    // 启用下载按钮
                    if (downloadBtn) {
                        downloadBtn.disabled = false;
                        downloadBtn.style.opacity = 1;
                    }
                } else {
                    console.warn("未找到有效的图片URL");
                    if (processedImage) {
                        processedImage.src = '';
                    }
                    
                    // 禁用下载按钮
                    if (downloadBtn) {
                        downloadBtn.disabled = true;
                        downloadBtn.style.opacity = 0.5;
                    }
                }
                
                // 设置描述文本
                let formattedContent = formatMarkdown(response.content || '处理完成');
                resultDescription.innerHTML = `
                    <span class="operation-tag ${operation}">${getOperationName(operation)}</span>
                    ${formattedContent}
                `;
                
                console.log("已设置结果描述");
            } else {
                // 纯文本响应
                resultDescription.innerHTML = formatMarkdown(response.content || '处理完成');
                
                // 清空图片
                if (processedImage) {
                    processedImage.src = '';
                }
                
                // 禁用下载按钮
                if (downloadBtn) {
                    downloadBtn.disabled = true;
                    downloadBtn.style.opacity = 0.5;
                }
            }
        }
        
        // 显示结果容器
        resultContainer.hidden = false;
    } catch (error) {
        console.error("显示结果时出错:", error);
        showToast(`显示结果时出错: ${error.message}`, 'error');
    }
}

/**
 * 获取操作名称的辅助函数
 */
function getOperationName(operation) {
    switch(operation) {
        case 'generate': return '图像生成';
        case 'style': return '风格转换';
        case 'creative': return '创意生成';
        default: return '图像处理';
    }
}

/**
 * 处理下载按钮点击事件
 * @param {string} imageUrl - 要下载的图片URL
 */
async function handleDownload(imageUrl) {
    try {
        // 如果没有图片URL，禁用下载按钮
        if (!imageUrl) {
            console.error("下载失败：没有有效的图片URL");
            showToast("无法下载：图片URL不可用", "error");
            
            // 禁用下载按钮
            const downloadBtn = document.getElementById('download-result-btn');
            if (downloadBtn) {
                downloadBtn.disabled = true;
                downloadBtn.style.opacity = 0.5;
            }
            return;
        }
        
        // 显示下载中提示
        showToast("正在准备下载...");
        
        try {
            // 获取图片扩展名
            const extension = getImageExtension(imageUrl) || 'png';
            
            // 构建文件名
            const operation = window.state.selectedOperation || 'image';
            const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
            const fileName = `${operation}_${timestamp}.${extension}`;
            
            // 使用fetch下载图片
            const response = await fetch(imageUrl);
            
            // 检查响应状态
            if (!response.ok) {
                throw new Error(`下载图片失败：HTTP状态 ${response.status}`);
            }
            
            // 获取Blob对象
            const blob = await response.blob();
            
            // 创建下载链接
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            
            // 触发下载
            document.body.appendChild(link);
            link.click();
            
            // 清理
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            
            // 显示成功提示
            showToast("下载成功！", "success");
        } catch (error) {
            console.error("图片下载错误:", error);
            
            // 作为备选方案，尝试直接打开图片URL
            showToast("直接下载失败，正在打开图片...", "warning");
            
            // 尝试在新窗口打开图片
            window.open(imageUrl, '_blank');
        }
    } catch (error) {
        console.error("处理下载操作时出错:", error);
        showToast("下载失败：" + error.message, "error");
    }
}

/**
 * 初始化结果查看器
 */
function initResultViewer() {
    // 关闭结果视图按钮
    const closeResultBtn = document.getElementById('close-result-btn');
    if (closeResultBtn) {
        closeResultBtn.addEventListener('click', () => {
            const resultContainer = document.getElementById('result-container');
            if (resultContainer) {
                console.log("关闭结果视图");
                resultContainer.classList.remove('show');
                // 延迟后添加hidden属性，让动画有时间执行
                setTimeout(() => {
                    resultContainer.setAttribute('hidden', '');
                }, 300);
            }
        });
    }
    
    // 下载按钮
    const downloadBtn = document.getElementById('download-result-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const processedImage = document.getElementById('processed-image');
            if (processedImage && processedImage.src) {
                handleDownload(processedImage.src);
            } else if (window.state.processedImage) {
                handleDownload(window.state.processedImage);
            } else {
                showToast('没有可下载的图片', 'error');
            }
        });
    }
    
    // 重试按钮
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', handleRetry);
    }
    
    // 为结果图片添加点击查看事件
    const resultImages = document.querySelectorAll('#processed-image, #original-image');
    resultImages.forEach(image => {
        image.addEventListener('click', function() {
            if (this.src && this.src !== '' && this.src !== 'undefined') {
                // 查看是否有createMobileImageViewer函数（移动端优化脚本已加载）
                if (typeof createMobileImageViewer === 'function') {
                    createMobileImageViewer(this.src);
                } else {
                    // 创建简单的图片查看器
                    createSimpleImageViewer(this.src);
                }
            }
        });
    });
}

/**
 * 创建简单的图片查看器（备用方案）
 * @param {string} imageSrc - 图片URL
 */
function createSimpleImageViewer(imageSrc) {
    // 检查是否已存在查看器
    let viewer = document.getElementById('simple-image-viewer');
    
    if (!viewer) {
        // 创建查看器元素
        viewer = document.createElement('div');
        viewer.id = 'simple-image-viewer';
        viewer.className = 'simple-image-viewer';
        
        // 添加HTML结构
        viewer.innerHTML = `
            <div class="viewer-backdrop"></div>
            <div class="viewer-content">
                <img src="${imageSrc}" alt="查看图片" class="viewer-image">
                <button class="viewer-close"><span class="material-symbols-rounded">close</span></button>
            </div>
        `;
        
        // 添加查看器样式
        const style = document.createElement('style');
        style.textContent = `
            .simple-image-viewer {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
                visibility: hidden;
            }
            
            .simple-image-viewer.active {
                opacity: 1;
                visibility: visible;
            }
            
            .simple-image-viewer .viewer-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.9);
                cursor: pointer;
            }
            
            .simple-image-viewer .viewer-content {
                position: relative;
                max-width: 95%;
                max-height: 90%;
                z-index: 2;
            }
            
            .simple-image-viewer .viewer-image {
                max-width: 100%;
                max-height: 85vh;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            }
            
            .simple-image-viewer .viewer-close {
                position: absolute;
                top: -40px;
                right: 0;
                background-color: rgba(255, 255, 255, 0.2);
                border: none;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                cursor: pointer;
            }
            
            .simple-image-viewer .viewer-close:hover {
                background-color: rgba(255, 255, 255, 0.3);
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(viewer);
        
        // 添加关闭按钮事件
        const closeBtn = viewer.querySelector('.viewer-close');
        const backdrop = viewer.querySelector('.viewer-backdrop');
        
        [closeBtn, backdrop].forEach(element => {
            element.addEventListener('click', function() {
                viewer.classList.remove('active');
                setTimeout(() => {
                    viewer.style.visibility = 'hidden';
                }, 300);
            });
        });
    } else {
        // 如果查看器已存在，更新图片
        const viewerImage = viewer.querySelector('.viewer-image');
        if (viewerImage) {
            viewerImage.src = imageSrc || '';
        }
    }
    
    // 显示查看器
    viewer.style.visibility = 'visible';
    setTimeout(() => {
        viewer.classList.add('active');
    }, 10);
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
    console.log(`处理模块: 检查步骤 ${window.state.currentStep} 的按钮状态`);
    
    // 获取对应的下一步按钮元素
    const currentStepButtonId = `next-to-step${Number(window.state.currentStep) + 2}`;
    const nextButton = document.getElementById(currentStepButtonId);
    
    if (nextButton) {
        console.log(`找到按钮: ${currentStepButtonId}, 当前状态: ${nextButton.disabled ? '禁用' : '启用'}`);
    } else {
        console.log(`未找到按钮: ${currentStepButtonId}`);
        return; // 如果找不到按钮元素，则退出函数
    }
    
    let shouldEnable = false;
    
    // 根据当前步骤判断是否应该启用按钮
    switch (window.state.currentStep) {
        case 1: // 图片上传步骤
            // 直接检查全局uploadedImages数组
            if (window.uploadedImages && window.uploadedImages.length > 0) {
                console.log(`已上传图片: true，数量: ${window.uploadedImages.length}`);
                shouldEnable = true;
            } else if (window.state.uploadedImages && window.state.uploadedImages.length > 0) {
                console.log(`state中有上传图片: true，数量: ${window.state.uploadedImages.length}`);
                shouldEnable = true;
            } else if (document.querySelectorAll('.image-preview-item').length > 0) {
                console.log(`DOM中找到图片预览元素，数量: ${document.querySelectorAll('.image-preview-item').length}`);
                shouldEnable = true;
            } else {
                console.log('未检测到已上传图片，禁用下一步按钮');
            }
            break;
            
        case 2: // 选择操作步骤
            if (window.state.selectedOperation) {
                shouldEnable = true;
            }
            break;
            
        // 其他步骤的按钮启用逻辑
        default:
            shouldEnable = true;
            break;
    }
    
    // 更新按钮状态
    if (shouldEnable) {
        nextButton.disabled = false;
        nextButton.classList.add('active');
        console.log(`已启用按钮: ${currentStepButtonId}`);
    } else {
        nextButton.disabled = true;
        nextButton.classList.remove('active');
        console.log(`已禁用按钮: ${currentStepButtonId}`);
    }
    
    // 如果已标记图片上传更新，检测所有下一步按钮
    if (window.uploadedImagesUpdated && window.state.currentStep === 1) {
        console.log('检测到uploadedImagesUpdated标志，更新所有下一步按钮');
        const allNextButtons = document.querySelectorAll('.next-btn');
        if (allNextButtons.length > 0) {
            allNextButtons.forEach(btn => {
                btn.disabled = false;
                btn.classList.add('active');
            });
        }
    }
}

/**
 * 更新按钮状态
 * @param {HTMLElement} button - 要更新的按钮元素
 */
function updateButtonState(button) {
    if (!button) return;
    
    // 确保全局状态存在
    if (!window.uploadedImages) {
        window.uploadedImages = [];
    }
    if (!window.state) {
        window.state = {
            uploadedImages: window.uploadedImages,
            instruction: ''
        };
    }
    
    // 统一使用全局上传数组
    if (window.state.uploadedImages && window.state.uploadedImages.length > 0) {
        // 确保全局数组与state同步
        window.uploadedImages = window.state.uploadedImages;
    } else if (window.uploadedImages && window.uploadedImages.length > 0) {
        // 确保state与全局数组同步
        window.state.uploadedImages = window.uploadedImages;
    }
    
    // 获取已上传图片
    const hasUploadedImages = window.uploadedImages && window.uploadedImages.length > 0;
    
    // 获取文本输入
    const hasInputText = document.getElementById('image-description') && 
                        document.getElementById('image-description').value.trim().length > 0;
    
    // 检查是否是步骤2的按钮（前往步骤3）
    const isStep2Button = button.id === 'next-to-step3';
    
    if (isStep2Button) {
        // 如果是图片上传步骤，判断是否有图片或文字输入
        const shouldEnable = hasUploadedImages || hasInputText;
        
        // 设置按钮状态
        button.disabled = !shouldEnable;
        
        if (shouldEnable) {
            button.classList.add('active');
            console.log('已启用按钮:', button.id || '无ID');
        } else {
            button.classList.remove('active');
            console.log('已禁用按钮:', button.id || '无ID');
        }
    } else {
        // 对于其他步骤的按钮，直接根据全局状态启用
        const shouldEnable = window.state && window.state.currentStep > 0;
        button.disabled = !shouldEnable;
        
        if (shouldEnable) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
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
 * 初始化处理按钮
 */
function initProcessingAction() {
    const startProcessingBtn = document.getElementById('start-processing');
    
    if (!startProcessingBtn) {
        console.error("未找到处理按钮");
        return;
    }
    
    startProcessingBtn.addEventListener('click', async () => {
        try {
            console.log("点击了开始处理按钮");
            
            // 禁用按钮防止重复点击
            startProcessingBtn.disabled = true;
            
            // 获取当前操作类型
            const operation = window.state.selectedOperation;
            
            // 获取并保存用户输入的风格指令（如果有）
            if (operation === 'style') {
                const styleInstructionInput = document.getElementById('style-custom-instruction');
                if (styleInstructionInput) {
                    const customInstruction = styleInstructionInput.value.trim();
                    if (customInstruction) {
                        window.state.styleInstruction = customInstruction;
                        console.log("已保存自定义风格指令:", customInstruction);
                    }
                }
            }
            
            // 检查图片上传状态（对于非生成操作）
            if (operation !== 'generate') {
                if (!window.state.uploadedImages || window.state.uploadedImages.length === 0) {
                    throw new Error("请先上传图片");
                }
                
                console.log("检测到上传的图片:", window.state.uploadedImages.length, "张");
            }
            
            // 调用处理函数
            await processImageWithInstruction();
            
                        } catch (error) {
            console.error("处理按钮事件错误:", error);
            showToast(error.message, 'error');
        } finally {
            // 重新启用按钮
            startProcessingBtn.disabled = false;
        }
    });
    
    console.log("处理按钮已初始化");
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
 * 重置全部状态，准备新的处理
 */
function resetState() {
    window.state = {
        currentStep: 1,
        selectedOperation: null,
        selectedStyle: null,
        selectedCreativeStyle: null,
        uploadedImages: [],
        uploadedImageUrl: null, // 添加上传图片的URL
        imageDescription: '',
        styleInstruction: '',
        creativeInstruction: '',
        customInstruction: '',
        processedImage: null,
        processingSuccess: false,
        processDescription: '',
        taskId: null,
        genId: null,
        originalWidth: null,
        originalHeight: null,
        lastApiResponse: null, // 添加最后一次API响应存储
        processingError: null // 添加处理错误存储
    };
    
    console.log("状态已重置");
    
    // 重置UI元素
    const previewContainer = document.getElementById('images-preview');
    if (previewContainer) {
        previewContainer.innerHTML = '';
    }
    
    const imageDescription = document.getElementById('image-description');
    if (imageDescription) {
        imageDescription.value = '';
    }
    
    const styleInstruction = document.getElementById('style-custom-instruction');
    if (styleInstruction) {
        styleInstruction.value = '';
    }
    
    // 移除所有选中的操作
    const operationOptions = document.querySelectorAll('.operation-option');
    operationOptions.forEach(option => {
        option.classList.remove('selected');
    });
    
    // 移除所有选中的风格
    const styleOptions = document.querySelectorAll('.style-option');
    styleOptions.forEach(option => {
        option.classList.remove('selected');
    });
    
    const creativeOptions = document.querySelectorAll('.creative-style-option');
    creativeOptions.forEach(option => {
        option.classList.remove('selected');
    });
    
    // 重置按钮状态
    checkAndEnableNextButton();
    
    console.log("UI已重置");
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
 * 处理API调用失败
 * @param {string} operation - 操作类型
 * @param {string|null} originalImageSrc - 原始图片URL，可以为null
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
    let errorTitle = "图像处理未成功";
    let errorSuggestions = [
        '检查您的网络连接是否稳定',
        '稍后再试，服务器可能暂时繁忙',
        '尝试使用不同的描述或风格',
        '尝试使用不同的图片（分辨率较低的图片处理速度可能更快）'
    ];
    
    // 检查错误内容，提供更具体的建议
    const errorDesc = window.state.processDescription || '';
    
    if (errorDesc.includes('检测到崩溃') || errorDesc.includes('interface conversion')) {
        errorTitle = "服务器暂时不可用";
        errorSuggestions = [
            '服务器可能正在维护或临时性崩溃',
            '稍等几分钟后再试',
            '可能API请求格式有问题，尝试刷新页面重新开始',
            '如果问题持续，请联系网站管理员'
        ];
    } else if (errorDesc.includes('no_more_channels_available') || errorDesc.includes('负载已饱和')) {
        errorTitle = "服务器负载已满";
        errorSuggestions = [
            '服务器当前请求量过大，请稍后再试',
            '尝试在非高峰时段使用',
            '可以尝试使用较低分辨率的图片',
            '如果问题持续，请联系网站管理员'
        ];
    }
    
    // 创建错误消息HTML
    let errorMessage = `
        <div class="error-view">
            <div class="error-icon">
                <span class="material-symbols-rounded">error_outline</span>
            </div>
            <h3>${errorTitle}</h3>
            <p>在${getOperationName(operation)}过程中遇到了问题。以下是可能的解决方案：</p>
            <ul class="error-suggestions">
                ${errorSuggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
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
        status: 'error'
    });
    
    // 为错误视图中的按钮添加事件监听器
    setTimeout(() => {
        const retryErrorBtn = document.getElementById('retry-error-btn');
        const backErrorBtn = document.getElementById('back-error-btn');
        
        if (retryErrorBtn) {
            retryErrorBtn.addEventListener('click', async () => {
                try {
                    // 显示加载提示
                    showToast('正在重新尝试...', 'info');
                    
                    // 调用重试函数
                    await handleRetry();
                } catch (error) {
                    console.error('重试错误:', error);
                    showToast(`重试失败: ${error.message}`, 'error');
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
 */
function initImageUpload() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.querySelector('.upload-btn');
    
    if (!uploadArea || !fileInput || !uploadBtn) {
        console.error('未找到图片上传元素');
        return;
    }
    
    // 点击上传按钮触发文件选择
    uploadBtn.addEventListener('click', () => {
        console.log("点击了上传按钮，触发文件选择");
        fileInput.click();
    });
    
    // 文件选择变化时处理上传
    fileInput.addEventListener('change', (e) => {
        console.log("文件选择变化，处理文件上传");
        const files = e.target.files;
        
        if (!files || files.length === 0) {
            console.log("没有选择文件");
            return;
        }
        
        console.log("选择了", files.length, "个图片文件");
        
        // 处理上传的图片
        handleFilesUpload(files);
    });
    
    // 拖放上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            console.log("拖放上传了", files.length, "个文件");
            handleFilesUpload(files);
        }
    });
    
    console.log("图片上传功能已初始化");
}

/**
 * 处理上传的文件
 * @param {FileList} files - 上传的文件列表
 */
function handleFilesUpload(files) {
    try {
        console.log("处理上传的图片文件");
        
        // 检查文件类型
        const imageFiles = Array.from(files).filter(file => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                console.warn(`跳过非图片文件: ${file.name}`);
            }
            return isImage;
        });
        
        if (imageFiles.length === 0) {
            showToast('请上传有效的图片文件（JPG, PNG, GIF等）', 'error');
            return;
        }
        
        // 检查文件大小
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB上限
        const validFiles = imageFiles.filter(file => {
            const isValidSize = file.size <= MAX_FILE_SIZE;
            if (!isValidSize) {
                console.warn(`文件过大: ${file.name} (${Math.round(file.size / 1024 / 1024)}MB)`);
                showToast(`文件 ${file.name} 超过10MB上限，已忽略`, 'warning');
            }
            return isValidSize;
        });
        
        if (validFiles.length === 0) {
            return;
        }
        
        // 检查总图片数量是否超过限制
        const MAX_TOTAL_FILES = 5;
        if (window.state.uploadedImages.length + validFiles.length > MAX_TOTAL_FILES) {
            showToast(`最多只能上传${MAX_TOTAL_FILES}张图片`, 'error');
            return;
        }
        
        // 检查是否有重复文件
        const newFiles = validFiles.filter(newFile => {
            const isDuplicate = window.state.uploadedImages.some(
                existingFile => existingFile.name === newFile.name && existingFile.size === newFile.size
            );
            if (isDuplicate) {
                showToast(`文件 ${newFile.name} 已经上传过了`, 'warning');
            }
            return !isDuplicate;
        });
        
        if (newFiles.length === 0) {
            return;
        }
        
        // 添加新文件到已上传图片数组
        window.state.uploadedImages = [...window.state.uploadedImages, ...newFiles];
        console.log("已更新state.uploadedImages，当前图片数量:", window.state.uploadedImages.length);
        
        // 为每个新文件创建预览
        newFiles.forEach(file => {
            createImagePreview(file);
        });
        
        // 更新按钮状态
        checkAndEnableNextButton();
        
    } catch (error) {
        console.error('处理文件上传时出错:', error);
        showToast('上传图片时出错: ' + error.message, 'error');
    }
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

/**
 * 从URL或文件名中获取图片扩展名
 * @param {string} url - 图片URL或文件名
 * @returns {string} 图片扩展名
 */
function getImageExtension(url) {
    if (!url) return 'png';
    
    try {
        // 尝试从URL中提取扩展名
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const filename = pathname.split('/').pop() || '';
        const ext = filename.split('.').pop()?.toLowerCase();
        
        // 检查是否获取到有效的扩展名
        if (ext && /^(jpg|jpeg|png|gif|webp|avif)$/i.test(ext)) {
            return ext;
        }
    } catch (error) {
        console.warn('无法解析URL:', error);
        // 如果不是有效URL，尝试直接从字符串提取
        const match = url.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
        if (match && match[1] && /^(jpg|jpeg|png|gif|webp|avif)$/i.test(match[1])) {
            return match[1].toLowerCase();
        }
    }
    
    // 检查URL中是否包含特定图片格式的提示
    if (url.includes('format=webp') || url.includes('fmt=webp')) return 'webp';
    if (url.includes('format=jpg') || url.includes('fmt=jpg')) return 'jpg';
    if (url.includes('format=png') || url.includes('fmt=png')) return 'png';
    
    // 对于data URL，检查MIME类型
    if (url.startsWith('data:')) {
        if (url.includes('image/jpeg')) return 'jpg';
        if (url.includes('image/png')) return 'png';
        if (url.includes('image/webp')) return 'webp';
        if (url.includes('image/gif')) return 'gif';
    }
    
    // 如果无法确定，默认返回png
    return 'png';
}

/**
 * 处理重试按钮点击事件
 */
async function handleRetry() {
    try {
        console.log("执行重试操作");
        
        // 确保我们有lastApiResponse
        if (!window.state.lastApiResponse) {
            console.error("没有找到上次的API响应，无法重试");
            showToast("无法重试操作，请重新开始", "error");
            return;
        }
        
        // 清除任何错误状态
        window.state.processingError = null;
        
        // 检查是否有上次的请求信息
        if (!window.state.selectedOperation) {
            throw new Error("没有找到上次的操作信息，无法重试");
        }
        
        // 获取当前操作类型和图片
        const operation = window.state.selectedOperation;
        let imageFile = null;
        
        // 如果不是生成操作，需要获取图片
        if (operation !== 'generate' && window.state.uploadedImages && window.state.uploadedImages.length > 0) {
            imageFile = window.state.uploadedImages[0];
        }
        
        // 显示加载指示器
        showLoadingIndicator('正在重新处理...');
        
        // 创建进度条
        createProgressBar();
        updateProgressBar(10, '准备重新处理...');
        
        // 构建指令
        let instruction = '';
        if (operation === 'generate') {
            // 生成操作的指令
            instruction = window.state.imageDescription || '';
            if (!instruction) {
                throw new Error("没有找到图片描述，无法重试生成操作");
            }
        } else if (operation === 'style') {
            // 风格转换操作的指令
            let style = window.state.selectedStyle;
            instruction = window.state.styleInstruction || '';
            
            // 如果没有自定义指令，尝试使用预设风格
            if (!instruction && style) {
                // 根据预设风格生成指令
                instruction = getStyleInstruction(style);
            }
            
            if (!instruction) {
                throw new Error("没有找到风格指令，无法重试风格转换操作");
            }
        } else if (operation === 'creative') {
            // 创意生成操作的指令
            let creativeStyle = window.state.selectedCreativeStyle;
            instruction = window.state.creativeInstruction || '';
            
            // 如果没有自定义指令，尝试使用预设创意风格
            if (!instruction && creativeStyle) {
                // 根据预设创意风格生成指令
                instruction = getCreativeInstruction(creativeStyle);
            }
            
            if (!instruction) {
                throw new Error("没有找到创意指令，无法重试创意生成操作");
            }
        }
        
        if (!instruction) {
            throw new Error("无法构建有效的指令，重试失败");
        }
        
        // 更新进度条
        updateProgressBar(20, '指令已准备，准备发送请求...');
        
        // 设置进度定时器
        let progress = 20;
        const progressInterval = setInterval(() => {
            if (progress < 90) {
                progress += Math.floor(Math.random() * 3) + 1;
                updateProgressBar(progress, '正在处理中...');
            }
        }, 1000);
        
        try {
            console.log("重新发送API请求，操作类型:", operation, "指令:", instruction);
            
            // 发送API请求
            const apiResponse = await window.API.processImageWithInstruction(imageFile, instruction);
            
            // 清除进度定时器
            clearInterval(progressInterval);
            
            // 处理API响应
            if (apiResponse) {
                console.log("API重试响应:", apiResponse);
                
                // 更新lastApiResponse
                window.state.lastApiResponse = apiResponse;
                
                // 更新进度条为完成状态
                updateProgressBar(100, '处理完成!');
                
                // 如果是成功的图片处理，保存图片URL
                if (apiResponse.imageUrl) {
                    window.state.processedImage = apiResponse.imageUrl;
                    window.state.taskId = apiResponse.taskId || null;
                    window.state.genId = apiResponse.genId || null;
                    
                    // 设置处理成功标志
                    window.state.processingSuccess = true;
                    window.state.processDescription = apiResponse.content || '处理完成';
                } else {
                    // 处理失败
                    window.state.processingSuccess = false;
                    window.state.processDescription = apiResponse.content || '处理失败';
                    
                    console.warn("API重试无法获取图片URL", apiResponse);
                }
                
                // 显示处理结果
                showResultView(apiResponse);
            } else {
                throw new Error("API重试返回空响应");
            }
        } catch (error) {
            console.error("重试过程中出错:", error);
            
            // 清除进度更新定时器
            clearInterval(progressInterval);
            
            // 设置处理失败标志
            window.state.processingSuccess = false;
            
            // 记录错误
            window.state.processingError = error;
            window.state.processDescription = `重试失败: ${error.message}`;
            
            // 创建错误响应对象并保存
            const errorResponse = {
                type: 'text',
                content: `重试失败: ${error.message}`,
                status: 'error'
            };
            window.state.lastApiResponse = errorResponse;
            
            // 更新进度条为错误状态
            updateProgressBar(100, '重试失败!', true);
            
            // 显示错误结果
            showResultView(errorResponse);
            
            // 隐藏加载指示器
            hideLoadingIndicator();
        }
    } catch (error) {
        console.error("准备重试时出错:", error);
        
        // 显示错误提示
        showToast(`无法重试: ${error.message}`, 'error');
        
        // 隐藏加载指示器
        hideLoadingIndicator();
    }
}

/**
 * 根据风格选择生成风格转换指令
 * @param {string} style - 风格标识
 * @returns {string} 格式化的指令文本
 */
function getStyleInstruction(style) {
    const styleMap = {
        'anime': '请将这张图片转换为以下风格：动漫风格，清新可爱的日系动漫风格。请保持图像主体特征，仅应用风格变化。',
        'oil': '请将这张图片转换为以下风格：油画风格，厚重的笔触和丰富的色彩。请保持图像主体特征，仅应用风格变化。',
        'sketch': '请将这张图片转换为以下风格：素描风格，黑白素描效果，强调线条和明暗对比。请保持图像主体特征，仅应用风格变化。',
        'pixel': '请将这张图片转换为以下风格：像素艺术风格，复古游戏像素效果，使用有限的调色板。请保持图像主体特征，仅应用风格变化。',
        'watercolor': '请将这张图片转换为以下风格：水彩画风格，轻盈透明的水彩效果，色彩柔和自然。请保持图像主体特征，仅应用风格变化。',
        'comic': '请将这张图片转换为以下风格：漫画风格，美式漫画风格，强调线条和分块色彩。请保持图像主体特征，仅应用风格变化。',
        'vintage': '请将这张图片转换为以下风格：复古风格，复古照片效果，怀旧色调，轻微褪色和颗粒感。请保持图像主体特征，仅应用风格变化。',
        'cyberpunk': '请将这张图片转换为以下风格：赛博朋克风格，霓虹灯效果和未来感，高对比度和饱和度的色彩。请保持图像主体特征，仅应用风格变化。'
    };
    
    return styleMap[style] || `请将这张图片转换为艺术风格，保持图像主体特征，仅应用风格变化。`;
}

/**
 * 根据创意风格选择生成创意转换指令
 * @param {string} creativeStyle - 创意风格标识
 * @returns {string} 格式化的指令文本
 */
function getCreativeInstruction(creativeStyle) {
    const creativeMap = {
        'creative': '基于这张图片创建创意变体，保持主体可识别，但可以添加创意元素和环境，整体风格更艺术化。',
        'poster': '将这张图片转换为具有社会批判性的艺术海报，添加适当的图像元素和构图，使整体风格更具冲击力和象征意义。',
        'sticker': '将图片主体转换为可爱的卡通贴纸，添加厚白色边框，背景透明，整体风格可爱简洁。'
    };
    
    return creativeMap[creativeStyle] || `基于这张图片创建创意变体，保持主体可识别但风格独特。`;
}

/**
 * 确保结果容器初始状态正确
 */
function initResultContainer() {
    const resultContainer = document.getElementById('result-container');
    if (resultContainer) {
        // 确保初始时结果容器是隐藏的
        resultContainer.setAttribute('hidden', '');
        resultContainer.classList.remove('show');
        console.log("初始化结果容器为隐藏状态");
    }
}

// 页面加载完成后初始化所有组件
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log("初始化处理页面组件");
        
        // 初始化状态
        resetState();
        
        // 初始化结果容器
        initResultContainer();
        
        // 初始化步骤导航
        initStepNavigation();
        
        // 初始化操作选择
        initOperationSelection();
        
        // 初始化图片上传
        initImageUpload();
        
        // 初始化文字描述
        initTextDescription();
        
        // 初始化风格选择
        initStyleSelection();
        
        // 初始化处理按钮
        initProcessingAction();
        
        // 初始化结果查看器
        initResultViewer();
        
        console.log("页面组件初始化完成");
    } catch (error) {
        console.error("初始化过程中出错:", error);
    }
});

/**
 * 创建图片预览元素
 * @param {File} file - 上传的图片文件
 */
function createImagePreview(file) {
    try {
        if (!file || !file.type.startsWith('image/')) {
            console.error('无效的图片文件:', file);
            return;
        }
        
        const previewContainer = document.getElementById('images-preview');
        if (!previewContainer) {
            console.error('未找到预览容器元素');
            return;
        }
        
        // 清除当前预览
        previewContainer.innerHTML = '';
        
        // 创建预览项
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        previewItem.dataset.filename = file.name;
        
        // 创建预览容器以保持图片比例
        const imageContainer = document.createElement('div');
        imageContainer.className = 'preview-image-container';
        
        // 创建图片元素
        const img = document.createElement('img');
        img.className = 'preview-image';
        img.alt = file.name;
        
        // 添加loading效果
        const loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'preview-loading';
        loadingSpinner.innerHTML = '<span class="material-symbols-rounded">hourglass_top</span>';
        imageContainer.appendChild(loadingSpinner);
        
        // 使用FileReader读取图片
        const reader = new FileReader();
        reader.onload = function(e) {
            // 移除loading效果
            loadingSpinner.remove();
            
            // 设置图片源
            img.src = e.target.result;
            
            // 保存上传图片的URL以便在结果视图中显示
            window.state.uploadedImageUrl = e.target.result;
            
            // 添加淡入效果
            setTimeout(() => {
                img.style.opacity = '1';
            }, 50);
            
            console.log(`已创建美化预览：${file.name}`);
            
            // 显示文件名和大小
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            fileInfo.textContent = `${file.name} (${formatFileSize(file.size)})`;
            previewItem.appendChild(fileInfo);
        };
        
        reader.onerror = function() {
            console.error(`图片预览生成失败: ${file.name}`);
            loadingSpinner.innerHTML = '<span class="material-symbols-rounded">error</span>';
            loadingSpinner.classList.add('error');
        };
        
        // 开始读取文件
        reader.readAsDataURL(file);
        
        // 设置初始不透明度为0，实现淡入效果
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease-in-out';
        
        // 创建删除按钮
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '<span class="material-symbols-rounded">close</span>';
        removeBtn.title = '删除图片';
        removeBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止事件冒泡
            removeImage(file.name);
        });
        
        // 组装预览项
        imageContainer.appendChild(img);
        previewItem.appendChild(imageContainer);
        previewItem.appendChild(removeBtn);
        previewContainer.appendChild(previewItem);
        
        // 更新上传区域显示状态
        updateUploadAreaDisplay();
        
        // 自动选中该图片
        toggleImageSelection(previewItem);
        
        // 更新当前步骤的按钮状态
        checkAndEnableNextButton();
        
        // 添加CSS样式
        addPreviewStyles();
    } catch (error) {
        console.error('创建图片预览时出错:', error);
    }
}

/**
 * 格式化文件大小
 * @param {number} bytes - 文件大小（字节）
 * @returns {string} 格式化后的大小
 */
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * 添加预览样式
 */
function addPreviewStyles() {
    // 检查是否已添加样式
    if (document.getElementById('preview-custom-styles')) {
        return;
    }
    
    // 创建样式元素
    const style = document.createElement('style');
    style.id = 'preview-custom-styles';
    style.textContent = `
        .preview-container {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-top: 20px;
            justify-content: center;
        }
        
        .preview-item {
            position: relative;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            width: 200px;
            background-color: #f8f9fa;
        }
        
        .preview-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }
        
        .preview-image-container {
            position: relative;
            width: 100%;
            height: 200px;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #ebedef;
        }
        
        .preview-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }
        
        .preview-item:hover .preview-image {
            transform: scale(1.05);
        }
        
        .remove-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            background-color: rgba(255, 255, 255, 0.8);
            border: none;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.3s, background-color 0.3s;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .preview-item:hover .remove-btn {
            opacity: 1;
        }
        
        .remove-btn:hover {
            background-color: #ff4d4f;
            color: white;
        }
        
        .file-info {
            padding: 10px;
            font-size: 12px;
            color: #666;
            background-color: white;
            text-align: center;
            word-break: break-all;
            border-top: 1px solid #eee;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .preview-loading {
            position: absolute;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
            background-color: rgba(255, 255, 255, 0.8);
            z-index: 1;
        }
        
        .preview-loading .material-symbols-rounded {
            font-size: 32px;
            color: #1677ff;
            animation: spin 1.5s linear infinite;
        }
        
        .preview-loading.error .material-symbols-rounded {
            color: #ff4d4f;
            animation: none;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* 黑暗模式适配 */
        .dark-theme .preview-item {
            background-color: #1a1d21;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .dark-theme .preview-image-container {
            background-color: #2a2d31;
        }
        
        .dark-theme .file-info {
            color: #bbb;
            background-color: #2a2d31;
            border-top: 1px solid #444;
        }
        
        .dark-theme .remove-btn {
            background-color: rgba(40, 44, 52, 0.8);
            color: #ddd;
        }
        
        .dark-theme .preview-loading {
            background-color: rgba(30, 34, 42, 0.8);
        }
    `;
    
    // 添加到文档
    document.head.appendChild(style);
    console.log("已添加预览样式");
}

/**
 * 删除已上传的图片
 * @param {string} filename - 要删除的图片文件名
 */
function removeImage(filename) {
    try {
        console.log(`删除图片: ${filename}`);
        
        // 更新状态
        window.state.uploadedImages = window.state.uploadedImages.filter(
            img => img.name !== filename
        );
        
        // 清除uploadedImageUrl
        window.state.uploadedImageUrl = null;
        
        // 移除图片预览
        const previewContainer = document.getElementById('images-preview');
        if (previewContainer) {
            const previewItem = previewContainer.querySelector(`.preview-item[data-filename="${filename}"]`);
            if (previewItem) {
                // 添加淡出动画
                previewItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                previewItem.style.opacity = '0';
                previewItem.style.transform = 'scale(0.9)';
                
                // 等待动画完成后移除元素
                setTimeout(() => {
                    previewContainer.removeChild(previewItem);
                    
                    // 如果没有图片了，更新上传区域显示
                    if (window.state.uploadedImages.length === 0) {
                        updateUploadAreaDisplay();
                    }
                }, 300);
            }
        }
        
        // 更新按钮状态
        checkAndEnableNextButton();
        
        showToast(`已删除图片: ${filename}`, 'info');
    } catch (error) {
        console.error(`删除图片出错: ${error.message}`);
    }
}

/**
 * 更新上传区域的显示状态
 */
function updateUploadAreaDisplay() {
    const uploadArea = document.getElementById('upload-area');
    const uploadInner = document.querySelector('.upload-inner');
    const previewContainer = document.getElementById('images-preview');
    
    if (!uploadArea || !uploadInner || !previewContainer) {
        console.warn('无法找到上传区域元素');
        return;
    }
    
    // 检查是否有上传的图片
    const hasUploads = window.state.uploadedImages && window.state.uploadedImages.length > 0;
    
    // 更新上传区域样式
    if (hasUploads) {
        // 如果有上传图片，调整上传区样式
        uploadInner.style.display = 'none';
        previewContainer.style.display = 'flex';
        uploadArea.classList.add('has-uploads');
        
        // 添加上传更多的按钮
        if (!document.getElementById('upload-more-btn')) {
            const uploadMoreBtn = document.createElement('button');
            uploadMoreBtn.id = 'upload-more-btn';
            uploadMoreBtn.className = 'upload-more-btn';
            uploadMoreBtn.innerHTML = '<span class="material-symbols-rounded">add_photo_alternate</span>上传更多';
            uploadMoreBtn.addEventListener('click', () => {
                document.getElementById('file-input').click();
            });
            uploadArea.appendChild(uploadMoreBtn);
            
            // 添加上传更多按钮的样式
            if (!document.getElementById('upload-more-styles')) {
                const style = document.createElement('style');
                style.id = 'upload-more-styles';
                style.textContent = `
                    .upload-more-btn {
                        position: absolute;
                        bottom: 15px;
                        right: 15px;
                        background-color: #1677ff;
                        color: white;
                        border: none;
                        border-radius: 20px;
                        padding: 8px 16px;
                        display: flex;
                        align-items: center;
                        font-size: 14px;
                        cursor: pointer;
                        transition: background-color 0.3s;
                        box-shadow: 0 2px 8px rgba(22, 119, 255, 0.3);
                        z-index: 2;
                    }
                    
                    .upload-more-btn .material-symbols-rounded {
                        margin-right: 6px;
                        font-size: 18px;
                    }
                    
                    .upload-more-btn:hover {
                        background-color: #0958d9;
                    }
                    
                    .dark-theme .upload-more-btn {
                        background-color: #177ddc;
                        box-shadow: 0 2px 8px rgba(23, 125, 220, 0.3);
                    }
                    
                    .dark-theme .upload-more-btn:hover {
                        background-color: #0a6bc9;
                    }
                    
                    .upload-area {
                        position: relative;
                        min-height: 240px;
                    }
                    
                    .upload-area.has-uploads {
                        background-color: transparent;
                        border: none;
                        box-shadow: none;
                    }
                `;
                document.head.appendChild(style);
            }
        }
    } else {
        // 如果没有上传图片，恢复默认样式
        uploadInner.style.display = 'block';
        previewContainer.style.display = 'none';
        uploadArea.classList.remove('has-uploads');
        
        // 移除上传更多按钮
        const uploadMoreBtn = document.getElementById('upload-more-btn');
        if (uploadMoreBtn) {
            uploadMoreBtn.remove();
        }
    }
    
    console.log(`上传区域显示状态已更新: 有上传图片=${hasUploads}`);
}

/**
 * 切换图片选择状态
 * @param {HTMLElement} previewItem - 图片预览元素
 */
function toggleImageSelection(previewItem) {
    if (!previewItem) return;
    
    // 所有预览项
    const allPreviewItems = document.querySelectorAll('.preview-item');
    
    // 取消所有选择
    allPreviewItems.forEach(item => {
        item.classList.remove('selected');
    });
    
    // 选中当前预览项
    previewItem.classList.add('selected');
    
    // 添加选中样式
    if (!document.getElementById('selection-styles')) {
        const style = document.createElement('style');
        style.id = 'selection-styles';
        style.textContent = `
            .preview-item.selected {
                outline: 3px solid #1677ff;
                box-shadow: 0 4px 14px rgba(22, 119, 255, 0.3);
            }
            
            .preview-item.selected::before {
                content: "✓";
                position: absolute;
                top: 10px;
                left: 10px;
                background-color: #1677ff;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 14px;
                z-index: 2;
            }
            
            .dark-theme .preview-item.selected {
                outline: 3px solid #177ddc;
                box-shadow: 0 4px 14px rgba(23, 125, 220, 0.3);
            }
            
            .dark-theme .preview-item.selected::before {
                background-color: #177ddc;
            }
        `;
        document.head.appendChild(style);
    }
    
    console.log(`已选中图片: ${previewItem.dataset.filename}`);
} 