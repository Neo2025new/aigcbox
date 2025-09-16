/**
 * 简单的内存速率限制器
 * 生产环境建议使用 Redis
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // 不使用 setInterval，改为在每次检查时自动清理
    // 这样在 serverless 环境中也能正常工作
  }

  /**
   * 检查是否允许请求
   */
  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();

    // 在检查前清理过期记录（避免内存泄漏）
    this.cleanup();
    const entry = this.limits.get(identifier);

    // 如果没有记录或已过期，创建新记录
    if (!entry || now > entry.resetTime) {
      const newEntry = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      this.limits.set(identifier, newEntry);
      
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: newEntry.resetTime,
      };
    }

    // 检查是否超过限制
    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // 增加计数
    entry.count++;
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * 清理过期记录
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      activeClients: this.limits.size,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
    };
  }
}

// 创建全局实例
const rateLimitPerMinute = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '10');
export const rateLimiter = new RateLimiter(rateLimitPerMinute, 60000);

/**
 * 从请求中获取客户端标识符
 */
export function getClientIdentifier(request: Request): string {
  // 优先使用 IP 地址
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  
  // 也可以结合用户代理创建更唯一的标识
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return `${ip}-${hashString(userAgent)}`;
}

/**
 * 简单的字符串哈希函数
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}