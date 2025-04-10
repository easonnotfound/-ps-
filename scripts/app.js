/**
 * 主应用逻辑 - 智能图文对话平台
 * 负责协调UI和API交互，处理用户操作和系统响应
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const submitBtn = document.getElementById('submit-btn');
    const instructionInput = document.getElementById('instruction-input');
    const chatContainer = document.getElementById('chat-container');
    const loadingIndicator = document.getElementById('loading-indicator');

    // 初始化应用
    function initApp() {
        // 绑定提交按钮点击事件
        submitBtn.addEventListener('click', handleSubmit);
        
        // 添加快捷键支持（Ctrl+Enter 或 Command+Enter 提交）
        instructionInput.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                if (!submitBtn.disabled) {
                    handleSubmit();
                }
            }
        });

        // 初始化时确保加载指示器隐藏
        if (loadingIndicator) {
            loadingIndicator.hidden = true;
        }
    }

    /**
     * 处理表单提交
     */
    async function handleSubmit() {
        // 获取用户输入和图片
        const instruction = instructionInput.value.trim();
        const currentImage = window.UI.getCurrentImage();
        
        // 验证输入
        if (!instruction || !currentImage) {
            window.UI.showToast('请上传图片并输入指令', 'error');
            return;
        }
        
        // 禁用提交按钮，防止重复提交
        submitBtn.disabled = true;
        
        // 获取图片URL用于显示
        const imageUrl = URL.createObjectURL(currentImage);
        
        // 移除欢迎消息（如果存在）
        const welcomeMessage = chatContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        // 添加用户消息到聊天界面
        const userMessage = window.UI.createUserMessageElement(instruction, imageUrl);
        chatContainer.appendChild(userMessage);
        
        // 滚动到底部
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // 显示加载提示和指示器
        window.UI.showToast('正在处理请求，请稍候...', 'success');
        loadingIndicator.hidden = false;
        
        try {
            console.log('开始调用API处理图片和指令');
            
            // 调用API处理图片和指令
            const response = await window.API.processImageWithInstruction(currentImage, instruction);
            
            console.log('API处理完成，响应类型:', response.type, '状态:', response.status);
            
            // 创建系统回复
            let systemMessage;
            if (response.type === 'text_and_image') {
                systemMessage = window.UI.createSystemMessageElement(
                    formatMarkdown(response.content), 
                    response.imageUrl,
                    response.status
                );
            } else {
                systemMessage = window.UI.createSystemMessageElement(
                    formatMarkdown(response.content),
                    null,
                    response.status
                );
            }
            
            // 添加系统回复到聊天界面
            chatContainer.appendChild(systemMessage);
            
            // 滚动到底部
            chatContainer.scrollTop = chatContainer.scrollHeight;
            
            // 显示成功或错误消息
            if (response.status === 'success') {
                window.UI.showToast('处理成功', 'success');
            } else {
                window.UI.showToast('处理完成，但存在一些问题', 'error');
            }
        } catch (error) {
            console.error('处理请求时发生错误:', error);
            window.UI.showToast('处理请求时发生错误，请重试', 'error');
            
            // 添加错误消息到聊天界面
            const errorMessage = window.UI.createSystemMessageElement(
                `处理请求时发生错误: ${error.message}. 请重试或尝试不同的指令。`, 
                null, 
                'error'
            );
            chatContainer.appendChild(errorMessage);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        } finally {
            // 重置输入框
            instructionInput.value = '';
            
            // 确保加载指示器隐藏
            loadingIndicator.hidden = true;
            console.log('加载指示器已隐藏');
            
            // 重新启用提交按钮状态
            updateSubmitButtonState();
        }
    }
    
    /**
     * 更新提交按钮状态
     */
    function updateSubmitButtonState() {
        const currentImage = window.UI.getCurrentImage();
        submitBtn.disabled = !currentImage || !instructionInput.value.trim();
    }
    
    /**
     * 处理图片文件拖放
     * 为整个文档添加拖放事件，以便在任何位置拖放文件都能触发上传
     */
    function setupDragDropEvents() {
        // 阻止默认拖放行为
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.body.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
    }
    
    /**
     * 添加用于演示的预设指令按钮
     * 这是可选的，可以帮助用户快速尝试不同类型的指令
     */
    function addPresetInstructionButtons() {
        const presetInstructions = [
            '描述这张图片中的内容',
            '将这张照片转换为动漫风格',
            '分析这张图片的主要色彩和构图',
            '创建一个基于这张图片的创意插图'
        ];
        
        // 这里可以创建和添加预设按钮
        // 实际实现可能因设计而异
    }

    /**
     * 简单格式化Markdown文本为HTML
     * @param {string} text - 包含markdown标记的文本
     * @returns {string} 格式化后的文本
     */
    function formatMarkdown(text) {
        if (!text) return '';
        
        // 移除可能包含的图片markdown标记 (已在API.js中处理了图片提取)
        text = text.replace(/!\[.*?\]\(https?:\/\/[^)]+\)/g, '');
        
        // 处理粗体
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // 处理斜体
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // 处理代码块
        text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        // 处理行内代码
        text = text.replace(/`(.*?)`/g, '<code>$1</code>');
        
        // 处理标题
        text = text.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
        text = text.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
        text = text.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
        
        // 处理列表
        text = text.replace(/^\* (.*?)$/gm, '<li>$1</li>');
        text = text.replace(/^- (.*?)$/gm, '<li>$1</li>');
        text = text.replace(/^(\d+)\. (.*?)$/gm, '<li>$2</li>');
        
        // 将换行符转换为<br>标签
        text = text.replace(/\n/g, '<br>');
        
        // 包装列表项
        text = text.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
        
        return text;
    }

    // 初始化应用
    initApp();
    setupDragDropEvents();
    
    // 可选：添加预设指令按钮
    // addPresetInstructionButtons();
}); 