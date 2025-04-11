/**
 * 首页交互逻辑 - 智能图文对话平台
 * 处理首页特有的交互，包括图片展示和放大查看功能
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 加载示例数据
    loadImageExamples();
    
    // 创建图片查看器
    createImageViewer();
    
    // 主题切换功能
    initThemeToggle();
});

/**
 * 初始化主题切换功能
 * 注意：此功能现已由ui.js中的同名函数实现，此处仅作为空函数保留，避免调用错误
 */
function initThemeToggle() {
    // 不执行任何操作，使用ui.js中的通用实现
    console.log('首页使用ui.js中的主题切换功能');
}

/**
 * 创建主题切换过渡动画元素
 * 注意：此功能已移除，由ui.js中的主题切换功能统一处理
 * @param {boolean} isDarkMode - 当前是否为深色模式
 */
function createThemeTransitionElements(isDarkMode) {
    // 不执行任何操作
}

/**
 * 创建太阳光芒动画
 */
function createSunRays(x, y) {
    const container = document.createElement('div');
    container.className = 'theme-animation-element toggle-rays';
    document.body.appendChild(container);
    
    // 创建8个光芒
    for (let i = 0; i < 8; i++) {
        const ray = document.createElement('div');
        ray.className = 'light-ray theme-animation-element';
        
        const length = 40 + Math.random() * 30;
        const angle = (i * 45) * (Math.PI / 180);
        
        ray.style.width = `${length}px`;
        ray.style.left = `${x}px`;
        ray.style.top = `${y}px`;
        ray.style.transform = `rotate(${i * 45}deg)`;
        ray.style.animationDelay = `${0.1 + i * 0.05}s`;
        
        document.body.appendChild(ray);
    }
}

/**
 * 创建云朵动画
 */
function createClouds(x, y) {
    for (let i = 0; i < 3; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud theme-animation-element';
        
        const size = 20 + Math.random() * 15;
        const offsetX = -40 + Math.random() * 80;
        const offsetY = -40 + Math.random() * 30;
        
        cloud.style.width = `${size}px`;
        cloud.style.height = `${size / 2}px`;
        cloud.style.left = `${x + offsetX}px`;
        cloud.style.top = `${y + offsetY}px`;
        cloud.style.animationDelay = `${0.3 + i * 0.2}s`;
        
        document.body.appendChild(cloud);
    }
}

/**
 * 创建星星动画
 */
function createStars(x, y) {
    for (let i = 0; i < 12; i++) {
        const star = document.createElement('div');
        star.className = 'star theme-animation-element';
        
        const size = 2 + Math.random() * 3;
        const distance = 30 + Math.random() * 50;
        const angle = Math.random() * Math.PI * 2;
        const offsetX = Math.cos(angle) * distance;
        const offsetY = Math.sin(angle) * distance;
        
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${x + offsetX}px`;
        star.style.top = `${y + offsetY}px`;
        star.style.animationDelay = `${i * 0.08}s`;
        
        document.body.appendChild(star);
    }
}

/**
 * 创建月球环形山动画
 */
function createMoonCraters(x, y) {
    for (let i = 0; i < 4; i++) {
        const crater = document.createElement('div');
        crater.className = 'moon-crater theme-animation-element';
        
        const size = 3 + Math.random() * 5;
        const angle = Math.random() * Math.PI * 2;
        const distance = 10 + Math.random() * 15;
        const offsetX = Math.cos(angle) * distance;
        const offsetY = Math.sin(angle) * distance;
        
        crater.style.width = `${size}px`;
        crater.style.height = `${size}px`;
        crater.style.left = `${x + offsetX}px`;
        crater.style.top = `${y + offsetY}px`;
        crater.style.animationDelay = `${0.2 + i * 0.1}s`;
        
        document.body.appendChild(crater);
    }
}

/**
 * 创建漩涡特效
 * 注意：此功能已移除，由ui.js中的主题切换功能统一处理
 * @param {boolean} isDarkMode - 当前是否为深色模式
 */
function createVortexEffect(isDarkMode) {
    // 不执行任何操作
}

/**
 * 创建涟漪效果
 * 注意：此功能已移除，由ui.js中的主题切换功能统一处理
 * @param {HTMLElement} element - 触发涟漪的元素
 * @param {boolean} isDarkMode - 当前是否为深色模式
 */
function createRippleEffect(element, isDarkMode) {
    // 不执行任何操作
}

/**
 * 创建闪光特效
 * 注意：此功能已移除，由ui.js中的主题切换功能统一处理
 * @param {HTMLElement} element - 触发闪光的元素
 * @param {number} count - 闪光数量
 * @param {boolean} isDarkMode - 当前是否为深色模式
 */
function createSparkleEffect(element, count, isDarkMode) {
    // 不执行任何操作
}

/**
 * 创建闪烁星星
 */
function createTwinkleStars(x, y) {
    for (let i = 0; i < 5; i++) {
        const star = document.createElement('div');
        star.className = 'twinkle-star theme-animation-element';
        
        const size = 1 + Math.random() * 2;
        const distance = 60 + Math.random() * 100;
        const angle = Math.random() * Math.PI * 2;
        const offsetX = Math.cos(angle) * distance;
        const offsetY = Math.sin(angle) * distance;
        
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${x + offsetX}px`;
        star.style.top = `${y + offsetY}px`;
        star.style.animationDelay = `${Math.random() * 1}s`;
        
        document.body.appendChild(star);
    }
}

/**
 * 创建图片查看器
 * 用于放大查看示例图片
 */
function createImageViewer() {
    // 创建图片查看器元素
    const imageViewer = document.createElement('div');
    imageViewer.className = 'image-viewer';
    imageViewer.id = 'home-image-viewer'; // 使用不同的ID
    imageViewer.innerHTML = `
        <div class="viewer-backdrop"></div>
        <div class="viewer-container">
            <div class="viewer-content">
                <img class="viewer-image" src="" alt="放大图片">
            </div>
            <button class="viewer-close">
                <span class="material-symbols-rounded">close</span>
            </button>
        </div>
    `;
    document.body.appendChild(imageViewer);
    
    // 获取元素
    const backdrop = imageViewer.querySelector('.viewer-backdrop');
    const closeBtn = imageViewer.querySelector('.viewer-close');
    const viewerImage = imageViewer.querySelector('.viewer-image');
    
    // 关闭查看器的点击事件
    backdrop.addEventListener('click', closeViewer);
    closeBtn.addEventListener('click', closeViewer);
    
    // 关闭查看器函数
    function closeViewer() {
        imageViewer.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // 绑定所有示例图片的点击事件
    document.addEventListener('click', function(e) {
        const target = e.target;
        if (target.tagName === 'IMG' && (target.closest('.example-image') || target.closest('.example-large-image'))) {
            const imgSrc = target.src;
            if (imgSrc && imgSrc !== '') {
                openViewer(imgSrc);
            }
        }
    });
    
    // 打开查看器函数
    function openViewer(imgSrc) {
        viewerImage.src = imgSrc || '';
        imageViewer.classList.add('active');
        document.body.style.overflow = 'hidden'; // 防止背景滚动
    }
}

/**
 * 加载示例图片数据
 */
function loadImageExamples() {
    // 示例数据划分为两个类别
    // 1. 风格迁移转换示例
    const styleExamples = [
        {
            title: '动漫风格转换',
            description: '将真实照片转换为日本动漫风格，保留原图特征同时呈现动漫质感。',
            originalImage: 'assets/examples/猫咪原图.png',
            processedImage: 'assets/examples/cartoon.jpg',
            processType: 'style'
        },
        {
            title: '油画风格转换',
            description: '将图像转换为古典油画风格，具有丰富的色彩层次和质感。',
            originalImage: 'assets/examples/猫咪原图.png',
            processedImage: 'assets/examples/oil.jpg',
            processType: 'style'
        },
        {
            title: '素描风格转换',
            description: '将图像转换为黑白素描风格，强调线条和明暗对比。',
            originalImage: 'assets/examples/猫咪原图.png',
            processedImage: 'assets/examples/sketch.jpg',
            processType: 'style'
        },
        {
            title: '像素艺术转换',
            description: '将图像转换为复古像素艺术风格，方块状图像元素。',
            originalImage: 'assets/examples/猫咪原图.png',
            processedImage: 'assets/examples/pixelart.jpg',
            processType: 'style'
        }
    ];
    
    // 2. 创意生成示例
    const creativeExamples = [
        {
            title: '吉卜力风格四格漫画',
            description: '将图像转换为宫崎骏吉卜力工作室风格的四格漫画，温暖柔和的色调和独特风格。',
            processedImage: 'assets/examples/吉卜力风格的四格漫画.png',
            processType: 'creative'
        },
        {
            title: '讽刺海报创作',
            description: '将图像转换为带有社会批判性的讽刺海报风格，具有强烈的视觉冲击力。',
            processedImage: 'assets/examples/讽刺海报.jpg',
            processType: 'creative'
        },
        {
            title: '卡通贴纸效果',
            description: '将图像转换为可爱的卡通贴纸风格，带有厚白边和透明背景，适合社交媒体分享。',
            processedImage: 'assets/examples/熊猫吃蛋筒冰淇凌的，厚白边和透明背景贴纸.png',
            processType: 'creative'
        }
    ];
    
    // 获取示例容器
    const examplesSection = document.querySelector('.examples-section');
    
    // 清空现有内容
    examplesSection.innerHTML = '';
    
    // 添加新标题
    const mainTitle = document.createElement('h2');
    mainTitle.className = 'section-title';
    mainTitle.textContent = '图像处理示例';
    examplesSection.appendChild(mainTitle);
    
    // === 添加风格迁移转换部分 ===
    const styleSection = document.createElement('div');
    styleSection.className = 'example-category';
    
    // 添加风格迁移标题
    const styleTitle = document.createElement('h3');
    styleTitle.className = 'category-title';
    styleTitle.textContent = '风格迁移转换';
    styleSection.appendChild(styleTitle);
    
    // 添加风格迁移描述
    const styleDesc = document.createElement('p');
    styleDesc.className = 'category-description';
    styleDesc.textContent = '将真实照片转换为日本动漫风格、油画风格、素描风格等多种艺术形式，保留原图特征同时呈现艺术质感。';
    styleSection.appendChild(styleDesc);
    
    // 创建风格示例网格
    const styleGrid = document.createElement('div');
    styleGrid.className = 'examples-grid';
    styleSection.appendChild(styleGrid);
    
    // 添加风格示例
    styleExamples.forEach(example => {
        const exampleElement = createExampleElement(example);
        styleGrid.appendChild(exampleElement);
    });
    
    // 将风格部分添加到主容器
    examplesSection.appendChild(styleSection);
    
    // === 添加创意生成部分 ===
    const creativeSection = document.createElement('div');
    creativeSection.className = 'example-category';
    
    // 添加创意生成标题
    const creativeTitle = document.createElement('h3');
    creativeTitle.className = 'category-title';
    creativeTitle.textContent = '创意生成';
    creativeSection.appendChild(creativeTitle);
    
    // 添加创意生成描述
    const creativeDesc = document.createElement('p');
    creativeDesc.className = 'category-description';
    creativeDesc.textContent = '基于原始图像创建创意变体，包括吉卜力风格四格漫画、讽刺海报和卡通贴纸效果，实现艺术构想与创意表达。';
    creativeSection.appendChild(creativeDesc);
    
    // 创建创意示例网格
    const creativeGrid = document.createElement('div');
    creativeGrid.className = 'examples-grid creative-grid';
    creativeSection.appendChild(creativeGrid);
    
    // 添加创意示例
    creativeExamples.forEach(example => {
        const exampleElement = createExampleElement(example);
        creativeGrid.appendChild(exampleElement);
    });
    
    // 将创意部分添加到主容器
    examplesSection.appendChild(creativeSection);
}

/**
 * 创建示例元素
 * @param {Object} example - 示例数据
 * @returns {HTMLElement} 示例元素
 */
function createExampleElement(example) {
    const card = document.createElement('div');
    card.className = 'example-card';
    
    if (example.processType === 'style') {
        // 风格转换类型的示例，显示原图和效果图对比
        card.innerHTML = `
            <div class="example-before-after">
                <div class="example-image before">
                    <img src="${example.originalImage}" alt="原始图片">
                    <span class="image-label">原始图片</span>
                </div>
                <div class="example-image after">
                    <img src="${example.processedImage}" alt="${example.title}">
                    <span class="image-label">${example.title}</span>
                </div>
            </div>
            <div class="example-info">
                <h3 class="example-title">${example.title}</h3>
                <p class="example-description">${example.description}</p>
                <a href="process.html?type=style" class="try-btn">尝试此效果</a>
            </div>
        `;
    } else {
        // 创意生成类型的示例，只显示效果图
        card.className = 'example-card creative-card';
        card.innerHTML = `
            <div class="example-large-image">
                <img src="${example.processedImage}" alt="${example.title}">
            </div>
            <div class="example-info">
                <h3 class="example-title">${example.title}</h3>
                <p class="example-description">${example.description}</p>
                <a href="process.html?type=creative" class="try-btn">尝试此效果</a>
            </div>
        `;
    }
    
    return card;
}

/**
 * 平滑滚动功能
 * 当点击导航链接时实现平滑滚动
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80, // 减去导航栏高度
                behavior: 'smooth'
            });
        }
    });
}); 