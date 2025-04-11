/**
 * API调用处理 - 智能图文对话平台
 * 负责与后端API交互，处理图片和指令的发送接收
 */

// API类 - 处理所有与服务器的交互
class API {
    constructor() {
        // API端点URL，使用yunwu.ai提供的API
        this.apiEndpoint = 'https://yunwu.ai/v1/chat/completions';
        
        // 你的API密钥 - 使用提供的密钥
        this.apiKey = 'sk-VXX8gTqtw2nQ0kzYq7VG4h1f9IBaB6kJd0xfUoPK9P83IsON';
        
        // 默认请求选项 - 根据API文档配置
        this.defaultOptions = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
        };
        
        // 用于存储延迟响应的属性
        this.lastResponseData = null;
        this.lastTaskId = null;
        this.lastGenId = null;
        
        console.log("API服务已初始化");
    }

    /**
     * 发送图片和指令到GPT-4o-alle服务
     * @param {File|null} imageFile - 用户上传的图片文件，如果是生成图片则为null
     * @param {string} instruction - 用户的指令文本
     * @returns {Promise} 包含处理结果的Promise
     */
    async processImageWithInstruction(imageFile, instruction) {
        try {
            console.log("开始处理图片和指令");
            
            // 显示加载指示器
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.hidden = false;
                console.log("加载指示器已显示");
            }
            
            try {
                // 准备API请求数据
                const requestData = {
                    model: "gpt-4o-image-vip", // 使用gpt-4o模型，它支持图像处理和生成
                    messages: [
                        {
                            role: "system",
                            content: imageFile ? 
                                "你是一个专业的图像处理助手，擅长风格转换、图像描述和创意变化。请仔细分析用户提供的图片，根据用户指令处理图片。处理后请务必保留原图像的主要特征，同时应用所需的风格变化。提供处理后的图片链接，并详细解释你的处理过程和结果。请注意：必须在回复中包含生成的图片链接（Markdown格式）。" : 
                                "你是一个专业的创意图像生成专家。请根据用户的文字描述创建精美的图像。确保图像质量高，与描述内容相符。你的回复必须包含生成的图片链接，并使用Markdown格式：![图片描述](http://图片URL)。请确保所有生成的图片链接正确且可访问。",
                        },
                        {
                            role: "user",
                            content: []
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 4096
                };

                // 添加指令文本
                requestData.messages[1].content.push({
                    type: "text",
                    text: instruction
                });

                // 如果提供了图片文件，添加到请求中
                if (imageFile) {
                    // 转换图片为base64
                    const imageDataBase64 = await this.convertImageToBase64(imageFile);

                    // 获取图片尺寸
                    const dimensions = await this.getImageDimensions(imageFile);

                    // 添加图片数据到请求
                    requestData.messages[1].content.push({
                        type: "image_url",
                        image_url: {
                            url: imageDataBase64,
                            detail: "high" // 使用高细节模式
                        }
                    });

                    // 设置图片尺寸以便后续处理
                    var imageWidth = dimensions.width;
                    var imageHeight = dimensions.height;
                } else {
                    // 如果没有图片，设置为null
                    var imageWidth = null;
                    var imageHeight = null;
                }

                console.log("API请求数据构建完成", { 
                    hasImage: !!imageFile, 
                    instruction,
                    imageWidth,
                    imageHeight
                });

                // 发送API请求
                console.log(`发送API请求到 ${this.apiEndpoint}`);
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    body: JSON.stringify(requestData)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorText}`);
                }

                // 解析API响应
                const data = await response.json();
                console.log("收到API响应:", data);
                
                // 保存最后一次响应数据，用于可能的延迟检查
                this.lastResponseData = data;
                
                // 提取task_id和gen_id（如果存在）
                if (data && data.choices && data.choices[0] && data.choices[0].message) {
                    const content = data.choices[0].message.content || '';
                    
                    // 提取task_id
                    const taskIdMatch = content.match(/task_id[：:]\s*["']?(task_[a-z0-9]+)["']?/i) || 
                                       content.match(/任务ID[：:]\s*["']?(task_[a-z0-9]+)["']?/i) ||
                                       content.match(/task_[a-z0-9]+/i);
                                       
                    // 提取gen_id
                    const genIdMatch = content.match(/gen_id[：:]\s*["']?(gen_[a-z0-9]+)["']?/i) ||
                                      content.match(/生成ID[：:]\s*["']?(gen_[a-z0-9]+)["']?/i) ||
                                      content.match(/gen_[a-z0-9]+/i);
                    
                    if (taskIdMatch && taskIdMatch[0]) {
                        this.lastTaskId = taskIdMatch[0];
                        console.log("保存任务ID:", this.lastTaskId);
                    }
                    
                    if (genIdMatch && genIdMatch[0]) {
                        this.lastGenId = genIdMatch[0];
                        console.log("保存生成ID:", this.lastGenId);
                    }
                }
                
                // 处理API响应
                return this.processApiResponse(data, instruction, imageWidth, imageHeight);
            } catch (error) {
                console.error("API请求处理错误:", error);
                return {
                    type: 'text',
                    content: `处理请求时发生错误: ${error.message}。请重试或检查控制台获取详细信息。`,
                    status: 'error'
                };
            } finally {
                // 确保无论如何都隐藏加载指示器
                const loadingIndicator = document.getElementById('loading-indicator');
                if (loadingIndicator) {
                    loadingIndicator.hidden = true;
                }
                console.log("加载指示器已隐藏");
            }
        } catch (error) {
            console.error('处理过程错误:', error);
            
            // 返回错误信息
            return {
                type: 'text',
                content: `处理请求时发生错误: ${error.message}。请重试或检查控制台获取详细信息。`,
                status: 'error'
            };
        }
    }

    /**
     * 将图片文件转换为base64格式
     * @param {File} file - 图片文件
     * @returns {Promise<string>} base64编码的图片数据
     */
    convertImageToBase64(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error("没有提供文件"));
                return;
            }
            
            const reader = new FileReader();
            reader.onload = () => {
                // 获取base64数据
                resolve(reader.result);
            };
            reader.onerror = (error) => {
                reject(error);
            };
            reader.readAsDataURL(file);
        });
    }

    /**
     * 获取图片文件的尺寸
     * @param {File} file - 图片文件
     * @returns {Promise<Object>} 包含宽度和高度的对象
     */
    getImageDimensions(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height
                });
                URL.revokeObjectURL(img.src); // 清理URL对象
            };
            img.onerror = () => {
                reject(new Error('无法加载图片获取尺寸'));
                URL.revokeObjectURL(img.src); // 清理URL对象
            };
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * 处理API响应
     * @param {Object} responseData - API响应数据
     * @param {string} instruction - 原始指令，用于错误信息
     * @param {number} originalWidth - 原始图片宽度，如果有的话
     * @param {number} originalHeight - 原始图片高度，如果有的话
     * @returns {Object} 处理后的响应内容
     */
    processApiResponse(responseData, instruction, originalWidth = null, originalHeight = null) {
        try {
            console.log("开始处理API响应...");
            
            // 检查响应有效性
            if (!responseData || !responseData.choices || !responseData.choices.length) {
                console.error("API响应数据结构不符合预期:", responseData);
                return {
                    type: 'text',
                    content: "API返回了无效的响应格式，请稍后重试。",
                    status: 'error'
                };
            }
            
            // 获取助手消息
            const assistantMessage = responseData.choices[0].message;
            if (!assistantMessage || !assistantMessage.content) {
                console.error("API响应中没有找到有效的助手消息:", responseData);
                return {
                    type: 'text',
                    content: "API响应中没有找到有效的内容，请稍后重试。",
                    status: 'error'
                };
            }
            
            // 获取内容
            let content = assistantMessage.content || '';
            console.log("AI响应内容:", content);
            
            // 保存最后一次响应数据，用于可能的延迟检查
            this.lastResponseData = responseData;
            
            // 提取图片URL - 支持更多种格式
            let imageUrl = null;
            
            // 尝试从 content_blocks 获取图片 (GPT-4o 最新格式)
            if (assistantMessage.content_blocks) {
                console.log("检测到content_blocks格式...");
                for (const block of assistantMessage.content_blocks) {
                    if (block.type === 'image' && block.image && block.image.url) {
                        imageUrl = block.image.url;
                        console.log("从content_blocks中提取URL:", imageUrl);
                        break;
                    }
                }
            }
            
            // 1. 支持Markdown格式的图片引用: ![desc](url)
            if (!imageUrl) {
                const markdownImageMatch = content.match(/!\[.*?\]\((https?:\/\/[^)]+)\)/);
                if (markdownImageMatch && markdownImageMatch[1]) {
                    imageUrl = markdownImageMatch[1];
                    console.log("从Markdown图片标记中提取URL:", imageUrl);
                }
            }
            
            // 2. 支持纯URL链接
            if (!imageUrl) {
                // 优先匹配https://开头的URL直到空格或引号或括号结束
                const urlMatch = content.match(/https:\/\/\S+?(?=[\s"')]|$)/);
                if (urlMatch && urlMatch[0]) {
                    imageUrl = urlMatch[0];
                    // 确保URL没有残留的引号或括号
                    imageUrl = imageUrl.replace(/['"()]$/, '');
                    console.log("从纯文本URL中提取:", imageUrl);
                }
            }
            
            // 3. 支持sdmntpr开头的OpenAI图片URL (以及其他OpenAI图片服务域名)
            if (!imageUrl) {
                const openaiMatch = content.match(/https:\/\/\S*?(?:sdmntpr|media\.instapipe|oaiusercontent)\S*?(?:png|jpg|jpeg|webp|avif)/i);
                if (openaiMatch && openaiMatch[0]) {
                    imageUrl = openaiMatch[0];
                    // 清理URL末尾的标点符号
                    imageUrl = imageUrl.replace(/[.,;:'")\]}>]$/, '');
                    console.log("从OpenAI URL中提取:", imageUrl);
                }
            }
            
            // 4. 支持filesystem.site域名的图片URL
            if (!imageUrl) {
                const filesystemMatch = content.match(/https:\/\/\S*?filesystem\.site\/\S+?(?:png|jpg|jpeg|webp|avif)/i);
                if (filesystemMatch && filesystemMatch[0]) {
                    imageUrl = filesystemMatch[0];
                    // 清理URL末尾的标点符号
                    imageUrl = imageUrl.replace(/[.,;:'")\]}>]$/, '');
                    console.log("从filesystem.site URL中提取:", imageUrl);
                }
            }
            
            // 5. 支持JSON格式中包含的图片URL
            if (!imageUrl) {
                try {
                    const jsonMatch = content.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
                    if (jsonMatch && jsonMatch[1]) {
                        const jsonData = JSON.parse(jsonMatch[1].trim());
                        
                        if (jsonData.image_url || jsonData.url) {
                            imageUrl = jsonData.image_url || jsonData.url;
                            console.log("从JSON数据中直接提取的图片URL:", imageUrl);
                        }
                    }
                } catch (jsonError) {
                    console.warn("从JSON提取数据失败:", jsonError);
                }
            }
            
            // 6. 检查gen_id，尝试构建图片URL
            if (!imageUrl) {
                // 提升匹配gen_id的能力
                const genIdPatterns = [
                    /gen_id:\s*[`"']?(gen_[a-z0-9]+)[`"']?/i,
                    /\bgen_([a-z0-9]+)\b/i,
                    /generation_id:\s*[`"']?(gen_[a-z0-9]+)[`"']?/i,
                    /\b(gen_[a-z0-9]+)\b/i
                ];
                
                let genId = null;
                for (const pattern of genIdPatterns) {
                    const match = content.match(pattern);
                    if (match && match[1]) {
                        genId = match[1];
                        break;
                    }
                }
                
                if (genId) {
                    console.log("提取的生成ID:", genId);
                    
                    // 保存genId供后续使用
                    if (genId && genId !== 'null' && genId !== 'undefined') {
                        this.lastGenId = genId;
                    }
                    
                    // 尝试提取taskId
                    const taskIdPatterns = [
                        /task_id:\s*[`"']?(task_[a-z0-9]+)[`"']?/i,
                        /\btask_([a-z0-9]+)\b/i,
                        /\b(task_[a-z0-9]+)\b/i
                    ];
                    
                    let taskId = null;
                    for (const pattern of taskIdPatterns) {
                        const match = content.match(pattern);
                        if (match && match[1]) {
                            taskId = match[1];
                            this.lastTaskId = taskId;
                            break;
                        }
                    }
                    
                    // 如果有taskId，尝试构建URL
                    if (this.lastTaskId) {
                        // 构建filesystem.site URL
                        imageUrl = `https://filesystem.site/vg-assets/assets/${this.lastTaskId}/${genId}.png`;
                        console.log("基于taskId和genId构建的图片URL:", imageUrl);
                    }
                }
            }
            
            // 7. 尝试从下载链接提取URL
            if (!imageUrl) {
                const downloadMatch = content.match(/\[下载[^\]]*\]\((https:\/\/[^)]+)\)/);
                if (downloadMatch && downloadMatch[1]) {
                    imageUrl = downloadMatch[1];
                    console.log("从下载链接提取URL:", imageUrl);
                }
            }
            
            // 8. 从错误文本中提取已生成的图片URL
            if (!imageUrl && content.includes("图片已生成")) {
                // 如果内容中提到"图片已生成"但没找到URL，检查是否有任务ID和生成ID可用
                if (this.lastTaskId && this.lastGenId) {
                    imageUrl = `https://filesystem.site/vg-assets/assets/${this.lastTaskId}/${this.lastGenId}.png`;
                    console.log("从错误信息中恢复图片URL:", imageUrl);
                }
            }
            
            console.log("最终提取的图片URL:", imageUrl);
            
            // 清理文本内容
            let cleanContent = content
                .replace(/```(?:json)?\s*\n[\s\S]*?\n```/g, '') // 移除JSON代码块
                .replace(/!\[.*?\]\(https?:\/\/.*?\)/g, '') // 移除图片引用
                .replace(/\s*(\d+%)?\s*(?:生成中|处理中|排队中).*?$/gm, '') // 移除进度行
                .trim();
                
            // 删除连续的空行，保留最多两个连续的换行符
            cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n');
            
            // 返回处理后的响应数据
            if (imageUrl) {
                return {
                    type: 'text_and_image',
                    content: cleanContent,
                    imageUrl: imageUrl,
                    status: 'success',
                    raw: responseData,
                    originalWidth: originalWidth,
                    originalHeight: originalHeight,
                    taskId: this.lastTaskId,
                    genId: this.lastGenId
                };
            } else {
                // 如果没有找到图片URL
                return {
                    type: 'text',
                    content: cleanContent,
                    status: 'success',
                    raw: responseData
                };
            }
        } catch (error) {
            console.error("处理API响应时出错:", error);
            return {
                type: 'text',
                content: `处理API响应时出错: ${error.message}。原始指令: "${instruction}"`,
                status: 'error'
            };
        }
    }
    
    /**
     * 从API响应内容中提取进度信息
     * @param {string} content - API响应内容
     * @returns {Object|null} 进度信息对象，如果没有找到进度信息则返回null
     */
    extractProgressInfo(content) {
        if (!content) return null;
        
        // 创建一个对象来存储提取的信息
        const progressInfo = {
            progressText: '',
            percentage: 0,
            taskId: null,
            genId: null,
            isCompleted: false
        };
        
        // 提取任务ID - 更新正则表达式以匹配更多格式
        const taskIdMatch = content.match(/task_id[：:]\s*["`]?(task_[a-z0-9]+)["`]?/i) ||
                           content.match(/任务ID[：:]\s*["`]?(task_[a-z0-9]+)["`]?/i) ||
                           content.match(/task_[a-z0-9]+/i);
        
        if (taskIdMatch) {
            progressInfo.taskId = taskIdMatch[0].replace(/task_id[：:]\s*["`]?/i, '').replace(/["`]$/,'');
        }
        
        // 提取生成ID - 更新正则表达式以匹配更多格式  
        const genIdMatch = content.match(/gen_id[：:]\s*["`]?(gen_[a-z0-9]+)["`]?/i) ||
                          content.match(/生成ID[：:]\s*["`]?(gen_[a-z0-9]+)["`]?/i) ||
                          content.match(/gen_[a-z0-9]+/i);
                          
        if (genIdMatch) {
            progressInfo.genId = genIdMatch[0].replace(/gen_id[：:]\s*["`]?/i, '').replace(/["`]$/,'');
        }
        
        // 检查是否包含类似于 "生成完成"、"处理完成" 或 "100%" 的文本
        if (content.includes("生成完成") || 
            content.includes("处理完成") || 
            content.includes("✅") || 
            content.includes("100%") ||
            (content.includes("完成") && content.includes("100"))) {
            progressInfo.isCompleted = true;
            progressInfo.percentage = 100;
        } else {
            // 提取进度百分比
            const percentMatch = content.match(/(\d+)[%％]/);
            if (percentMatch && percentMatch[1]) {
                progressInfo.percentage = parseInt(percentMatch[1]);
            }
            
            // 检查处理阶段
            if (content.includes("排队中")) {
                progressInfo.stage = "queuing";
                // 如果只是排队中，设置进度为5%
                if (progressInfo.percentage === 0) {
                    progressInfo.percentage = 5;
                }
            } else if (content.includes("生成中") || content.includes("处理中")) {
                progressInfo.stage = "generating";
                // 如果只是生成中但没有具体进度，设置为20%
                if (progressInfo.percentage === 0) {
                    progressInfo.percentage = 20;
                }
            }
        }
        
        // 提取进度文本
        const progressLine = content.match(/.*?(\d+[%％]|排队中|生成中|处理中|生成完成|处理完成).*$/m);
        if (progressLine) {
            progressInfo.progressText = progressLine[0].trim();
        }
        
        // 只有当找到了任何进度信息时才返回对象
        if (progressInfo.taskId || progressInfo.genId || progressInfo.percentage > 0 || progressInfo.progressText) {
            return progressInfo;
        }
        
        return null;
    }

    // 添加一个模拟响应方法，在API不可用时使用
    getSimulatedResponse(instruction) {
        const lowerInstruction = instruction.toLowerCase();
        
        if (lowerInstruction.includes('描述') || lowerInstruction.includes('识别') || lowerInstruction.includes('看到')) {
            return {
                type: 'text',
                content: `这是一张模拟的图片分析结果：我看到这张图片中包含了自然景观。图片的风格是写实风格，主要色调为绿色和蓝色。图片中最引人注目的元素是中心区域的明亮部分。\n\n请注意：这是模拟响应，因为API请求失败。`,
                status: 'error'
            };
        } else if (lowerInstruction.includes('动漫') || lowerInstruction.includes('风格') || lowerInstruction.includes('转换')) {
            return {
                type: 'text',
                content: `我无法将图片转换为您要求的风格，因为API请求失败。请检查网络连接或API配置后重试。`,
                status: 'error'
            };
        } else {
            return {
                type: 'text',
                content: `API请求失败，无法处理您的指令："${instruction}"。请检查网络连接或API配置，然后重试。`,
                status: 'error'
            };
        }
    }

    /**
     * 检查是否有延迟响应
     * 对于超时但实际上API已返回结果的情况
     * @returns {Promise<Object|null>} 延迟响应或null
     */
    async checkDelayedResponse() {
        try {
            // the lastTaskId and lastGenId 尝试查询
            if (this.lastTaskId && this.lastGenId) {
                console.log("检查延迟响应，任务ID:", this.lastTaskId, "生成ID:", this.lastGenId);
                
                // 构建检查指令
                const checkInstruction = `查询任务: ${this.lastTaskId}, 生成ID: ${this.lastGenId}`;
                
                // 发送请求
                const response = await this.processImageWithInstruction(null, checkInstruction);
                
                if (response && response.type === 'text_and_image' && response.imageUrl) {
                    console.log("找到延迟响应:", response);
                    return response;
                }
            }
            
            // 如果有最近的响应数据，但没有找到图片URL，尝试再次处理
            if (this.lastResponseData) {
                // 尝试重新处理最后的响应数据
                const reprocessed = this.processApiResponse(this.lastResponseData, "重新处理延迟响应");
                
                if (reprocessed && reprocessed.type === 'text_and_image' && reprocessed.imageUrl) {
                    console.log("通过重新处理找到图片URL:", reprocessed);
                    return reprocessed;
                }
            }
            
            return null;
        } catch (error) {
            console.error("检查延迟响应出错:", error);
            return null;
        }
    }
}

// 创建API对象并导出
window.API = new API(); 