/**
 * 浏览器兼容性检测和Polyfill支持
 */

// 检测浏览器特性支持
export const BrowserSupport = {
  // File API 支持检测
  supportsFileAPI: (): boolean => {
    return !!(window.File && window.FileReader && window.FileList && window.Blob);
  },

  // Drag & Drop API 支持检测
  supportsDragDrop: (): boolean => {
    const div = document.createElement('div');
    return 'draggable' in div || ('ondragstart' in div && 'ondrop' in div);
  },

  // Intersection Observer 支持检测
  supportsIntersectionObserver: (): boolean => {
    return 'IntersectionObserver' in window;
  },

  // ResizeObserver 支持检测
  supportsResizeObserver: (): boolean => {
    return 'ResizeObserver' in window;
  },

  // Web Vitals 支持检测
  supportsPerformanceObserver: (): boolean => {
    return 'PerformanceObserver' in window;
  },

  // CSS Grid 支持检测
  supportsCSSGrid: (): boolean => {
    const element = document.createElement('div');
    return 'grid' in element.style;
  },

  // CSS Custom Properties 支持检测
  supportsCSSCustomProperties: (): boolean => {
    return window.CSS && CSS.supports && CSS.supports('color', 'var(--test)');
  },

  // Webp 格式支持检测
  supportsWebP: (): Promise<boolean> => {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  },

  // 获取浏览器信息
  getBrowserInfo: () => {
    const ua = navigator.userAgent;
    const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor);
    const isSafari = /Safari/.test(ua) && /Apple Computer/.test(navigator.vendor);
    const isFirefox = /Firefox/.test(ua);
    const isEdge = /Edg/.test(ua);
    const isMobile = /Mobi|Android/i.test(ua);

    return {
      isChrome,
      isSafari,
      isFirefox,
      isEdge,
      isMobile,
      userAgent: ua
    };
  }
};

// Polyfill加载器
export class PolyfillLoader {
  private static loadedPolyfills = new Set<string>();

  // 动态加载IntersectionObserver Polyfill
  static async loadIntersectionObserver(): Promise<void> {
    if (BrowserSupport.supportsIntersectionObserver() || this.loadedPolyfills.has('intersection-observer')) {
      return;
    }

    try {
      await import('intersection-observer');
      this.loadedPolyfills.add('intersection-observer');
      console.log('IntersectionObserver polyfill loaded');
    } catch (error) {
      console.warn('Failed to load IntersectionObserver polyfill:', error);
    }
  }

  // 动态加载ResizeObserver Polyfill
  static async loadResizeObserver(): Promise<void> {
    if (BrowserSupport.supportsResizeObserver() || this.loadedPolyfills.has('resize-observer')) {
      return;
    }

    try {
      const { ResizeObserver } = await import('@juggle/resize-observer');
      (window as any).ResizeObserver = ResizeObserver;
      this.loadedPolyfills.add('resize-observer');
      console.log('ResizeObserver polyfill loaded');
    } catch (error) {
      console.warn('Failed to load ResizeObserver polyfill:', error);
    }
  }

  // 加载所有必需的polyfills
  static async loadAll(): Promise<void> {
    const promises: Promise<void>[] = [];

    if (!BrowserSupport.supportsIntersectionObserver()) {
      promises.push(this.loadIntersectionObserver());
    }

    if (!BrowserSupport.supportsResizeObserver()) {
      promises.push(this.loadResizeObserver());
    }

    await Promise.all(promises);
  }
}

// 浏览器兼容性警告组件数据
export const BrowserWarnings = {
  // 检查是否需要显示兼容性警告
  shouldShowWarning: (): { show: boolean; message?: string } => {
    const browser = BrowserSupport.getBrowserInfo();
    
    // 检查IE浏览器
    if (browser.userAgent.includes('Trident') || browser.userAgent.includes('MSIE')) {
      return {
        show: true,
        message: '检测到您正在使用Internet Explorer浏览器，可能无法正常使用本应用的所有功能。建议使用Chrome、Firefox、Safari或Edge浏览器。'
      };
    }

    // 检查老版本Chrome
    const chromeMatch = browser.userAgent.match(/Chrome\/(\d+)/);
    if (chromeMatch && parseInt(chromeMatch[1]) < 80) {
      return {
        show: true,
        message: '您的Chrome浏览器版本过低，建议升级到80版本以上以获得最佳体验。'
      };
    }

    // 检查Safari版本
    const safariMatch = browser.userAgent.match(/Version\/(\d+)/);
    if (browser.isSafari && safariMatch && parseInt(safariMatch[1]) < 14) {
      return {
        show: true,
        message: '您的Safari浏览器版本较低，建议升级到14版本以上以获得最佳体验。'
      };
    }

    return { show: false };
  }
};

// CSS特性检测和降级
export const CSSFeatureDetection = {
  // 检测并应用CSS Grid降级
  handleGridSupport: () => {
    if (!BrowserSupport.supportsCSSGrid()) {
      // 为不支持Grid的浏览器添加降级样式
      const style = document.createElement('style');
      style.innerHTML = `
        .grid-fallback {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .grid-fallback > * {
          flex: 1 1 300px;
        }
      `;
      document.head.appendChild(style);
      
      // 给需要Grid的元素添加降级class
      document.querySelectorAll('[style*="display: grid"], .grid').forEach(el => {
        el.classList.add('grid-fallback');
      });
    }
  },

  // 检测CSS Custom Properties支持
  handleCustomPropertiesSupport: () => {
    if (!BrowserSupport.supportsCSSCustomProperties()) {
      // 可以在这里添加CSS变量的降级处理
      console.warn('CSS Custom Properties not supported, consider using a PostCSS plugin for fallbacks');
    }
  }
};

// 图片格式降级处理
export const ImageFormatSupport = {
  // 获取最佳支持的图片格式
  getBestImageFormat: async (): Promise<'webp' | 'jpg'> => {
    const supportsWebP = await BrowserSupport.supportsWebP();
    return supportsWebP ? 'webp' : 'jpg';
  },

  // 图片源地址转换
  getOptimizedImageSrc: async (baseSrc: string): Promise<string> => {
    const format = await ImageFormatSupport.getBestImageFormat();
    if (format === 'webp' && !baseSrc.includes('.webp')) {
      return baseSrc.replace(/\.(jpg|jpeg|png)$/, '.webp');
    }
    return baseSrc;
  }
};