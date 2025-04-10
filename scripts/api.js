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
            // 显示加载指示器
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.hidden = false;
            }
            
            console.log(`处理请求: ${imageFile ? '图片处理' : '纯文本生成'}, 指令: ${instruction}`);
            
            // 构建消息内容数组 - 根据文档格式化
            const messages = [
                {
                    "role": "system",
                    "content": "你是一个专业的图像处理助手。请根据用户的请求处理图像。请确保保留原始图像的主体特征，仅应用风格变化。请严格按照用户的指示进行图像处理。输出的图像应与输入图像的尺寸相同。对于图片处理，请详细解释你做了什么。"
                }
            ];
            
            // 获取原始图片尺寸
            let imageWidth = null;
            let imageHeight = null;
            let imageRatio = "1:1"; // 默认比例
            
            // 根据是否有图片准备不同的用户消息内容
            if (imageFile) {
                try {
                    // 获取图片尺寸
                    const dimensions = await this.getImageDimensions(imageFile);
                    imageWidth = dimensions.width;
                    imageHeight = dimensions.height;
                    imageRatio = `${imageWidth}:${imageHeight}`;
                    console.log(`原始图片尺寸: ${imageWidth}x${imageHeight}, 比例: ${imageRatio}`);
                    
                    // 将图片转换为base64格式
                    const imageBase64 = await this.convertImageToBase64(imageFile);
                    console.log("图片已转换为Base64格式");
                    
                    // 构建带图片的用户消息 - 符合API要求的格式
                    const userContent = [
                        {
                            "type": "text",
                            "text": `${instruction}\n请确保输出图像与输入图像尺寸相同，比例为 ${imageRatio}。请严格保持图像的主体特征，仅应用风格变化。`
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": imageBase64
                            }
                        }
                    ];
                    
                    messages.push({
                        "role": "user",
                        "content": userContent
                    });
                } catch (imgError) {
                    console.error("图片转换错误:", imgError);
                    throw new Error(`图片处理失败: ${imgError.message}`);
                }
            } else {
                // 添加纯文本的用户消息 - 用于一句话生成美图功能
                messages.push({
                    "role": "user",
                    "content": instruction
                });
            }
            
            // 准备请求数据 - 严格按照API文档要求
            const requestData = {
                "model": "gpt-4o-image-vip", // 更新为支持图像生成的最新模型
                "messages": messages,
                "max_tokens": 4000,
                "temperature": 0.7
            };
            
            console.log("正在发送API请求...");
            
            try {
                // 发送请求到API
                const response = await fetch(this.apiEndpoint, {
                    ...this.defaultOptions,
                    body: JSON.stringify(requestData)
                });
                
                console.log("收到API响应状态:", response.status);
                
                // 检查响应状态
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("API响应错误:", errorText);
                    throw new Error(`API请求失败: 状态码 ${response.status}, 响应: ${errorText}`);
                }
                
                // 获取响应JSON
                const data = await response.json();
                console.log("API响应内容:", data);
                
                // 保存最后的响应数据，用于可能的延迟响应检查
                this.lastResponseData = data;
                
                // 从响应中提取任务ID和生成ID
                if (data && data.choices && data.choices.length > 0 && data.choices[0].message) {
                    const content = data.choices[0].message.content || '';
                    
                    // 提取任务ID和生成ID
                    const taskIdMatch = content.match(/task_[a-z0-9]+/) || 
                                       content.match(/任务ID[：:]\s*["`]?(task_[a-z0-9]+)["`]?/);
                    const genIdMatch = content.match(/gen_[a-z0-9]+/) ||
                                      content.match(/生成ID[：:]\s*["`]?(gen_[a-z0-9]+)["`]?/);
                    
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
            } catch (fetchError) {
                console.error("网络请求错误:", fetchError);
                
                // 返回错误信息
                return {
                    type: 'text',
                    content: `API请求失败: ${fetchError.message}。请检查网络连接或API密钥配置，然后重试。`,
                    status: 'error'
                };
            }
        } catch (error) {
            console.error('处理过程错误:', error);
            
            // 返回错误信息
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
            
            // 提取图片URL - 支持不同的格式
            let imageUrl = null;
            
            // 1. 支持Markdown格式的图片引用: ![desc](url)
            const markdownImageMatch = content.match(/!\[(.*?)\]\((https?:\/\/[^)]+)\)/);
            if (markdownImageMatch && markdownImageMatch[2]) {
                imageUrl = markdownImageMatch[2];
                console.log("从Markdown图片标记中提取URL:", imageUrl);
            }
            
            // 2. 支持纯URL链接
            if (!imageUrl) {
                const urlMatch = content.match(/https:\/\/\S+?(?=\s|$)/);
                if (urlMatch && urlMatch[0]) {
                    imageUrl = urlMatch[0];
                    console.log("从纯文本URL中提取:", imageUrl);
                }
            }
            
            // 3. 支持sdmntpr开头的OpenAI图片URL
            if (!imageUrl) {
                const openaiMatch = content.match(/https:\/\/sdmntpr[^"\s)]+/i);
                if (openaiMatch && openaiMatch[0]) {
                    imageUrl = openaiMatch[0];
                    console.log("从OpenAI URL中提取:", imageUrl);
                }
            }
            
            // 4. 支持filesystem.site域名的图片URL(特别适用于当前响应)
            if (!imageUrl) {
                const filesystemMatch = content.match(/https:\/\/filesystem\.site\/cdn\/[^"\s)]+/i);
                if (filesystemMatch && filesystemMatch[0]) {
                    imageUrl = filesystemMatch[0];
                    console.log("从filesystem.site URL中提取:", imageUrl);
                }
            }
            
            // 5. 支持OpenAI文件ID的图片处理
            if (!imageUrl && assistantMessage.file_ids && assistantMessage.file_ids.length > 0) {
                const fileId = assistantMessage.file_ids[0];
                console.log("从file_ids中提取文件ID:", fileId);
                // 无法直接构建URL，需要API支持
            }
            
            // 6. 支持JSON格式中包含的图片URL(已有逻辑，保留)
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
            
            // 7. 检查gen_id，尝试构建图片URL
            const genIdMatch = content.match(/gen_id:\s*[`"]?(gen_[a-z0-9]+)[`"]?/i) || content.match(/gen_([a-z0-9]+)/i);
            if (!imageUrl && genIdMatch && genIdMatch[1]) {
                const genId = genIdMatch[1];
                console.log("提取的生成ID:", genId);
                
                // 保存genId供后续使用
                if (genId && genId !== 'null' && genId !== 'undefined') {
                    this.lastGenId = genId;
                }
                
                // 如果有taskId，尝试构建URL
                if (this.lastTaskId) {
                    // 构建filesystem.site URL
                    imageUrl = `https://filesystem.site/vg-assets/assets/${this.lastTaskId}/${genId}.png`;
                    console.log("基于taskId和genId构建的图片URL:", imageUrl);
                }
            }
            
            // 8. 尝试从下载链接提取URL
            if (!imageUrl) {
                const downloadMatch = content.match(/\[下载[^\]]*\]\((https:\/\/[^)]+)\)/);
                if (downloadMatch && downloadMatch[1]) {
                    imageUrl = downloadMatch[1];
                    console.log("从下载链接提取URL:", imageUrl);
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