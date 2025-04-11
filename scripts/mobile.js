/**
 * 移动端优化脚本 - 智能图文对话平台
 * 优化在移动设备上的用户体验和交互
 */

// 在页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('初始化移动端优化...');
    
    // 检测是否为移动设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        console.log('检测到移动设备，应用移动端优化');
        initMobileOptimizations();
    }
});

/**
 * 初始化所有移动端优化
 */
function initMobileOptimizations() {
    // 防止双击缩放
    preventDoubleTapZoom();
    
    // 添加触摸反馈效果
    addTouchFeedback();
    
    // 优化表单元素在移动端的体验
    optimizeFormElements();
    
    // 添加下拉刷新阻止
    preventPullToRefresh();
    
    // 优化图片查看体验
    optimizeImageViewing();
    
    // 添加返回顶部按钮（在长页面滚动时显示）
    addScrollToTopButton();
    
    console.log('移动端优化初始化完成');
}

/**
 * 防止双击缩放
 * 在iOS上，双击会导致页面缩放，这个函数可以防止这种行为
 */
function preventDoubleTapZoom() {
    // 为所有可点击元素添加touch事件处理
    const clickableElements = document.querySelectorAll('a, button, .operation-option, .style-option, .creative-style-option, .example-prompt');
    
    clickableElements.forEach(element => {
        // 使用touchend事件替代click事件，以消除300ms延迟
        element.addEventListener('touchend', function(e) {
            // 阻止默认行为，防止双击缩放
            e.preventDefault();
            
            // 手动触发点击事件
            if (this.tagName === 'A' && this.hasAttribute('href')) {
                const href = this.getAttribute('href');
                if (href.startsWith('#')) {
                    // 如果是页内锚点，使用scrollIntoView
                    const targetElement = document.querySelector(href);
                    if (targetElement) {
                        targetElement.scrollIntoView({ 
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                } else {
                    // 如果是外部链接，手动导航
                    window.location.href = href;
                }
            } else {
                // 对于其他可点击元素，触发click事件
                this.click();
            }
        }, { passive: false });
    });
    
    console.log('已应用防止双击缩放优化');
}

/**
 * 添加触摸反馈效果
 * 当用户点击元素时提供视觉反馈
 */
function addTouchFeedback() {
    // 为可交互元素添加触摸反馈
    const interactiveElements = document.querySelectorAll('a, button, .operation-option, .style-option, .preview-item, .example-prompt');
    
    interactiveElements.forEach(element => {
        // 添加触摸开始效果
        element.addEventListener('touchstart', function() {
            this.classList.add('touch-active');
        }, { passive: true });
        
        // 触摸结束或取消时移除效果
        ['touchend', 'touchcancel'].forEach(event => {
            element.addEventListener(event, function() {
                this.classList.remove('touch-active');
                
                // 300ms后再次检查并移除，确保在所有情况下都能移除
                setTimeout(() => {
                    this.classList.remove('touch-active');
                }, 300);
            }, { passive: true });
        });
    });
    
    // 添加触摸反馈样式
    addTouchFeedbackStyles();
    
    console.log('已应用触摸反馈效果');
}

/**
 * 添加触摸反馈样式
 */
function addTouchFeedbackStyles() {
    // 检查是否已添加样式
    if (document.getElementById('touch-feedback-styles')) {
        return;
    }
    
    // 创建样式元素
    const style = document.createElement('style');
    style.id = 'touch-feedback-styles';
    style.textContent = `
        .touch-active {
            opacity: 0.7 !important;
            transform: scale(0.97) !important;
            transition: transform 0.1s ease-out, opacity 0.1s ease-out !important;
        }
        
        /* 防止移动端长按选择文本 */
        body {
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }
        
        /* 允许在输入框中选择文本 */
        input, textarea {
            -webkit-user-select: auto;
            -khtml-user-select: auto;
            -moz-user-select: auto;
            -ms-user-select: auto;
            user-select: auto;
        }
        
        /* 修复iOS上的输入框样式问题 */
        input, textarea, select, button {
            -webkit-appearance: none;
            border-radius: 0;
        }
        
        /* 修复移动端上的hover效果 */
        @media (hover: none) {
            .operation-option:hover,
            .style-option:hover,
            .creative-style-option:hover,
            .example-prompt:hover,
            .feature-card:hover {
                transform: none !important;
                box-shadow: none !important;
            }
            
            .example-prompt:hover::after {
                display: none !important;
            }
        }
    `;
    
    // 添加到文档
    document.head.appendChild(style);
}

/**
 * 优化表单元素在移动端的体验
 */
function optimizeFormElements() {
    // 优化文本区域自动调整高度
    const textareas = document.querySelectorAll('textarea');
    
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            // 重置高度以获取正确的scrollHeight
            this.style.height = 'auto';
            
            // 设置新高度
            const newHeight = this.scrollHeight;
            this.style.height = newHeight + 'px';
        });
        
        // 初始化高度
        textarea.dispatchEvent(new Event('input'));
    });
    
    // 修复iOS上输入时的视口调整问题
    const inputs = document.querySelectorAll('input, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            // 添加页面内边距，确保表单元素可见
            document.body.style.paddingBottom = '200px';
            
            // 1秒后滚动到聚焦的元素
            setTimeout(() => {
                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
        
        input.addEventListener('blur', function() {
            // 移除额外内边距
            document.body.style.paddingBottom = '';
        });
    });
    
    console.log('已优化表单元素体验');
}

/**
 * 防止下拉刷新
 * 在某些移动浏览器中，向下拖动页面会导致刷新
 */
function preventPullToRefresh() {
    // 防止页面被下拉刷新
    document.body.addEventListener('touchmove', function(e) {
        // 如果已经滚动到顶部，且尝试继续下拉
        if (window.scrollY === 0 && e.touches[0].screenY > e.touches[0].screenY && e.cancelable) {
            e.preventDefault();
        }
    }, { passive: false });
    
    console.log('已应用防止下拉刷新');
}

/**
 * 优化图片查看体验
 */
function optimizeImageViewing() {
    // 只在处理页面上应用此功能
    // 检查当前页面是否为处理页面，避免与首页的查看器冲突
    const isProcessPage = document.querySelector('.process-main') !== null;
    
    if (isProcessPage) {
        // 查找所有结果图片
        const resultImages = document.querySelectorAll('#processed-image, #original-image');
        
        resultImages.forEach(image => {
            // 点击图片时放大查看
            image.addEventListener('click', function() {
                if (this.src && this.src !== '') {
                    // 创建图片查看器
                    createMobileImageViewer(this.src);
                }
            });
        });
        
        console.log('已优化处理页面图片查看体验');
    } else {
        console.log('当前不是处理页面，跳过图片查看器优化');
    }
}

/**
 * 创建移动端图片查看器 - 使用独立的ID和类名避免与首页查看器冲突
 * @param {string} imageSrc - 图片源URL
 */
function createMobileImageViewer(imageSrc) {
    // 检查是否已存在查看器
    let viewer = document.getElementById('mobile-image-viewer');
    
    if (!viewer) {
        // 创建查看器元素
        viewer = document.createElement('div');
        viewer.id = 'mobile-image-viewer';
        viewer.className = 'mobile-image-viewer';
        
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
            .mobile-image-viewer {
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
            }
            
            .mobile-image-viewer.active {
                opacity: 1;
            }
            
            .viewer-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.9);
            }
            
            .viewer-content {
                position: relative;
                max-width: 95%;
                max-height: 90%;
                z-index: 2;
            }
            
            .viewer-image {
                max-width: 100%;
                max-height: 85vh;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            }
            
            .viewer-close {
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
            
            .viewer-close:active {
                background-color: rgba(255, 255, 255, 0.3);
            }
        `;
        
        document.head.appendChild(style);
        
        // 添加到文档
        document.body.appendChild(viewer);
        
        // 添加关闭按钮事件
        const closeBtn = viewer.querySelector('.viewer-close');
        const backdrop = viewer.querySelector('.viewer-backdrop');
        
        [closeBtn, backdrop].forEach(element => {
            element.addEventListener('click', function() {
                viewer.classList.remove('active');
                setTimeout(() => {
                    document.body.removeChild(viewer);
                }, 300);
            });
        });
        
        // 阻止图片点击冒泡
        const viewerImage = viewer.querySelector('.viewer-image');
        viewerImage.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    } else {
        // 如果查看器已存在，更新图片
        const viewerImage = viewer.querySelector('.viewer-image');
        if (viewerImage) {
            viewerImage.src = imageSrc || '';
        }
    }
    
    // 延迟显示，以便添加过渡效果
    setTimeout(() => {
        viewer.classList.add('active');
    }, 10);
}

/**
 * 添加返回顶部按钮
 */
function addScrollToTopButton() {
    // 创建按钮元素
    const scrollTopBtn = document.createElement('button');
    scrollTopBtn.className = 'scroll-top-btn';
    scrollTopBtn.innerHTML = '<span class="material-symbols-rounded">arrow_upward</span>';
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .scroll-top-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background-color: var(--primary-color);
            color: white;
            border: none;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 90;
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.3s, transform 0.3s;
            cursor: pointer;
        }
        
        .scroll-top-btn.visible {
            opacity: 1;
            transform: translateY(0);
        }
        
        .scroll-top-btn .material-symbols-rounded {
            font-size: 24px;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(scrollTopBtn);
    
    // 添加点击事件
    scrollTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // 监听滚动事件，显示/隐藏按钮
    let scrollTimer;
    window.addEventListener('scroll', function() {
        clearTimeout(scrollTimer);
        
        // 如果滚动超过屏幕高度的20%，显示按钮
        if (window.scrollY > window.innerHeight * 0.2) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
        
        // 如果滚动停止，2秒后隐藏按钮
        scrollTimer = setTimeout(() => {
            scrollTopBtn.classList.remove('visible');
        }, 2000);
    });
    
    console.log('已添加返回顶部按钮');
} 