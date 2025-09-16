/**
 * 图片优化工具
 * 提供图片压缩、格式转换、懒加载等功能
 */

// 图片压缩配置
interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

/**
 * 压缩图片
 * @param file 原始文件
 * @param options 压缩选项
 * @returns 压缩后的Blob
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    mimeType = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // 计算缩放比例
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建canvas上下文'));
          return;
        }

        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('图片压缩失败'));
            }
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 批量压缩图片
 */
export async function compressImages(
  files: File[],
  options?: CompressionOptions
): Promise<Blob[]> {
  return Promise.all(files.map(file => compressImage(file, options)));
}

/**
 * 将base64转换为Blob
 */
export function base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * 将Blob转换为base64
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 获取图片尺寸
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('无法获取图片尺寸'));
    };
    
    img.src = url;
  });
}

/**
 * 检查图片格式是否支持
 */
export function isSupportedImageFormat(file: File): boolean {
  const supportedFormats = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];
  
  return supportedFormats.includes(file.type);
}

/**
 * 优化的图片预加载
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 批量预加载图片
 */
export async function preloadImages(srcs: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(srcs.map(preloadImage));
}

/**
 * 创建图片占位符
 */
export function createPlaceholder(width: number, height: number, color: string = '#f0f0f0'): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
  }
  
  return canvas.toDataURL();
}

/**
 * 渐进式图片加载配置
 */
export interface ProgressiveImageConfig {
  thumbnail: string;
  src: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * 渐进式加载图片
 */
export class ProgressiveImage {
  private config: ProgressiveImageConfig;
  private thumbnailLoaded = false;
  private fullImageLoaded = false;

  constructor(config: ProgressiveImageConfig) {
    this.config = config;
  }

  async load(): Promise<{ thumbnail: HTMLImageElement; full: HTMLImageElement }> {
    // 加载缩略图
    const thumbnail = await this.loadThumbnail();
    
    // 加载完整图片
    const full = await this.loadFullImage();
    
    return { thumbnail, full };
  }

  private loadThumbnail(): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.thumbnailLoaded = true;
        resolve(img);
      };
      img.onerror = reject;
      img.src = this.config.thumbnail;
    });
  }

  private loadFullImage(): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.fullImageLoaded = true;
        this.config.onLoad?.();
        resolve(img);
      };
      img.onerror = (e) => {
        const error = new Error('图片加载失败');
        this.config.onError?.(error);
        reject(error);
      };
      img.src = this.config.src;
    });
  }
}

/**
 * 图片懒加载观察器
 */
export class LazyImageObserver {
  private observer: IntersectionObserver;
  private images: Map<Element, string> = new Map();

  constructor(options: IntersectionObserverInit = {}) {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
        }
      });
    }, {
      rootMargin: '50px',
      threshold: 0.01,
      ...options
    });
  }

  observe(element: Element, src: string): void {
    this.images.set(element, src);
    this.observer.observe(element);
  }

  unobserve(element: Element): void {
    this.images.delete(element);
    this.observer.unobserve(element);
  }

  private loadImage(element: Element): void {
    const src = this.images.get(element);
    if (!src) return;

    if (element instanceof HTMLImageElement) {
      element.src = src;
      element.onload = () => {
        element.classList.add('loaded');
        this.unobserve(element);
      };
    }
  }

  disconnect(): void {
    this.observer.disconnect();
    this.images.clear();
  }
}