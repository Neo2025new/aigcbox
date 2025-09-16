/**
 * API 缓存系统
 * 提供内存缓存、LocalStorage缓存、请求去重等功能
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  storage?: 'memory' | 'localStorage' | 'sessionStorage';
  keyPrefix?: string;
}

/**
 * 通用缓存类
 */
export class Cache<T = any> {
  private memoryCache = new Map<string, CacheEntry<T>>();
  private options: Required<CacheOptions>;
  private pendingRequests = new Map<string, Promise<T>>();

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: 5 * 60 * 1000, // 默认5分钟
      storage: 'memory',
      keyPrefix: 'api_cache_',
      ...options
    };

    // 启动时清理过期缓存
    this.cleanExpiredCache();
  }

  /**
   * 获取缓存
   */
  get(key: string): T | null {
    const fullKey = this.getFullKey(key);
    
    if (this.options.storage === 'memory') {
      const entry = this.memoryCache.get(fullKey);
      if (entry && this.isValid(entry)) {
        return entry.data;
      }
    } else {
      const stored = this.getFromStorage(fullKey);
      if (stored && this.isValid(stored)) {
        return stored.data;
      }
    }
    
    return null;
  }

  /**
   * 设置缓存
   */
  set(key: string, data: T, ttl?: number): void {
    const fullKey = this.getFullKey(key);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };

    if (this.options.storage === 'memory') {
      this.memoryCache.set(fullKey, entry);
    } else {
      this.setToStorage(fullKey, entry);
    }

    // 如果设置了特定的TTL，在过期后自动删除
    const expireTime = ttl || this.options.ttl;
    setTimeout(() => this.delete(key), expireTime);
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    const fullKey = this.getFullKey(key);
    
    if (this.options.storage === 'memory') {
      this.memoryCache.delete(fullKey);
    } else {
      this.removeFromStorage(fullKey);
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    if (this.options.storage === 'memory') {
      this.memoryCache.clear();
    } else {
      this.clearStorage();
    }
    this.pendingRequests.clear();
  }

  /**
   * 获取或请求数据（防止重复请求）
   */
  async getOrFetch(
    key: string,
    fetcher: () => Promise<T>,
    options?: { ttl?: number; force?: boolean }
  ): Promise<T> {
    // 如果不强制刷新，先检查缓存
    if (!options?.force) {
      const cached = this.get(key);
      if (cached !== null) {
        return cached;
      }
    }

    // 检查是否有正在进行的请求
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    // 发起新请求
    const request = fetcher()
      .then((data) => {
        this.set(key, data, options?.ttl);
        this.pendingRequests.delete(key);
        return data;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, request);
    return request;
  }

  /**
   * 检查缓存是否有效
   */
  private isValid(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < this.options.ttl;
  }

  /**
   * 获取完整的缓存键
   */
  private getFullKey(key: string): string {
    return `${this.options.keyPrefix}${key}`;
  }

  /**
   * 从存储中获取
   */
  private getFromStorage(key: string): CacheEntry<T> | null {
    try {
      const storage = this.getStorage();
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  /**
   * 设置到存储
   */
  private setToStorage(key: string, entry: CacheEntry<T>): void {
    try {
      const storage = this.getStorage();
      storage.setItem(key, JSON.stringify(entry));
    } catch (e) {
      console.warn('缓存存储失败:', e);
      // 如果存储失败，降级到内存缓存
      this.memoryCache.set(key, entry);
    }
  }

  /**
   * 从存储中删除
   */
  private removeFromStorage(key: string): void {
    try {
      const storage = this.getStorage();
      storage.removeItem(key);
    } catch {
      // 忽略错误
    }
  }

  /**
   * 清空存储
   */
  private clearStorage(): void {
    try {
      const storage = this.getStorage();
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key?.startsWith(this.options.keyPrefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => storage.removeItem(key));
    } catch {
      // 忽略错误
    }
  }

  /**
   * 获取存储对象
   */
  private getStorage(): Storage {
    if (this.options.storage === 'sessionStorage') {
      return sessionStorage;
    }
    return localStorage;
  }

  /**
   * 清理过期缓存
   */
  private cleanExpiredCache(): void {
    if (this.options.storage === 'memory') {
      // 内存缓存清理
      setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of this.memoryCache.entries()) {
          if (now - entry.timestamp > this.options.ttl) {
            this.memoryCache.delete(key);
          }
        }
      }, 60000); // 每分钟清理一次
    } else {
      // 存储缓存清理
      this.cleanStorageCache();
    }
  }

  /**
   * 清理存储中的过期缓存
   */
  private cleanStorageCache(): void {
    try {
      const storage = this.getStorage();
      const now = Date.now();
      const keysToRemove: string[] = [];

      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key?.startsWith(this.options.keyPrefix)) {
          const item = storage.getItem(key);
          if (item) {
            try {
              const entry: CacheEntry<T> = JSON.parse(item);
              if (now - entry.timestamp > this.options.ttl) {
                keysToRemove.push(key);
              }
            } catch {
              keysToRemove.push(key);
            }
          }
        }
      }

      keysToRemove.forEach(key => storage.removeItem(key));
    } catch {
      // 忽略错误
    }
  }
}

/**
 * API 请求包装器
 */
export class CachedAPI {
  private cache: Cache;

  constructor(options?: CacheOptions) {
    this.cache = new Cache(options);
  }

  /**
   * GET 请求
   */
  async get<T>(
    url: string,
    options?: RequestInit & { cache?: boolean; ttl?: number }
  ): Promise<T> {
    const cacheKey = this.getCacheKey('GET', url, options);
    
    if (options?.cache !== false) {
      return this.cache.getOrFetch(
        cacheKey,
        () => fetch(url, options).then(res => res.json()),
        { ttl: options?.ttl }
      );
    }

    return fetch(url, options).then(res => res.json());
  }

  /**
   * POST 请求
   */
  async post<T>(
    url: string,
    body?: any,
    options?: RequestInit & { cache?: boolean; ttl?: number }
  ): Promise<T> {
    const cacheKey = this.getCacheKey('POST', url, { ...options, body });
    
    // POST 请求默认不缓存，除非明确指定
    if (options?.cache === true) {
      return this.cache.getOrFetch(
        cacheKey,
        () => fetch(url, {
          method: 'POST',
          body: JSON.stringify(body),
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers
          },
          ...options
        }).then(res => res.json()),
        { ttl: options?.ttl }
      );
    }

    return fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      ...options
    }).then(res => res.json());
  }

  /**
   * 清除特定URL的缓存
   */
  invalidate(url: string, method: string = 'GET'): void {
    const cacheKey = this.getCacheKey(method, url);
    this.cache.delete(cacheKey);
  }

  /**
   * 清除所有缓存
   */
  invalidateAll(): void {
    this.cache.clear();
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(method: string, url: string, options?: any): string {
    const params = options?.body ? JSON.stringify(options.body) : '';
    return `${method}_${url}_${params}`;
  }
}

// 导出默认实例
export const apiCache = new CachedAPI({
  ttl: 5 * 60 * 1000, // 5分钟
  storage: 'memory'
});

// 导出特定的缓存实例
export const imageCache = new Cache<string>({
  ttl: 30 * 60 * 1000, // 30分钟
  storage: 'localStorage',
  keyPrefix: 'img_cache_'
});

export const sessionCache = new Cache({
  ttl: 30 * 60 * 1000, // 30分钟
  storage: 'sessionStorage',
  keyPrefix: 'session_cache_'
});