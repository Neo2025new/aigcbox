import { LRUCache } from 'lru-cache';
import type { NextRequest } from 'next/server';

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset?: number;
};

// 创建一个全局缓存实例
const tokenCache = new LRUCache<string, number[]>({
  max: 500, // 最多存储500个唯一token
  ttl: 60000, // 60秒后过期
});

export function rateLimit(options?: Options) {
  const interval = options?.interval || 60000; // 默认1分钟
  const uniqueTokenPerInterval = options?.uniqueTokenPerInterval || 500;

  return {
    check: async (token: string, limit: number): Promise<RateLimitResult> => {
      const now = Date.now();
      const tokenData = tokenCache.get(token) || [0, now];
      const [count, timestamp] = tokenData;
      
      // 如果时间窗口已过，重置计数
      if (now - timestamp > interval) {
        tokenCache.set(token, [1, now]);
        return {
          success: true,
          limit,
          remaining: limit - 1,
          reset: now + interval,
        };
      }
      
      // 检查是否超过限制
      if (count >= limit) {
        return {
          success: false,
          limit,
          remaining: 0,
          reset: timestamp + interval,
        };
      }
      
      // 增加计数
      tokenCache.set(token, [count + 1, timestamp]);
      
      return {
        success: true,
        limit,
        remaining: limit - (count + 1),
        reset: timestamp + interval,
      };
    },
  };
}

// 从请求中提取客户端标识
export function getClientIdentifier(request: NextRequest): string {
  // 优先使用真实IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  // 按优先级选择IP
  const ip = cfConnectingIp || realIp || forwardedFor?.split(',')[0] || 'unknown';
  
  // 可以结合用户代理创建更唯一的标识
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const identifier = `${ip}:${userAgent.substring(0, 50)}`;
  
  return identifier;
}

// 预定义的速率限制器
export const apiLimiter = rateLimit({
  interval: 60 * 1000, // 1分钟
  uniqueTokenPerInterval: 1000,
});

export const strictLimiter = rateLimit({
  interval: 60 * 1000, // 1分钟
  uniqueTokenPerInterval: 100,
});

export const uploadLimiter = rateLimit({
  interval: 5 * 60 * 1000, // 5分钟
  uniqueTokenPerInterval: 500,
});

// 中间件辅助函数
export async function checkRateLimit(
  request: NextRequest,
  limiter = apiLimiter,
  limit = 10
): Promise<RateLimitResult & { identifier: string }> {
  const identifier = getClientIdentifier(request);
  const result = await limiter.check(identifier, limit);
  
  return {
    ...result,
    identifier,
  };
}

// IP黑名单管理
const blacklistedIPs = new Set<string>();
const tempBannedIPs = new LRUCache<string, number>({
  max: 1000,
  ttl: 15 * 60 * 1000, // 15分钟临时封禁
});

export function isIPBlacklisted(ip: string): boolean {
  return blacklistedIPs.has(ip) || tempBannedIPs.has(ip);
}

export function temporarilyBanIP(ip: string, duration = 15 * 60 * 1000): void {
  tempBannedIPs.set(ip, Date.now() + duration);
}

// 速率限制响应头
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
  };
  
  if (result.reset) {
    headers['X-RateLimit-Reset'] = new Date(result.reset).toISOString();
  }
  
  if (!result.success) {
    const retryAfter = result.reset ? Math.ceil((result.reset - Date.now()) / 1000) : 60;
    headers['Retry-After'] = retryAfter.toString();
  }
  
  return headers;
}