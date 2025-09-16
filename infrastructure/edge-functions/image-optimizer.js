// Cloudflare Worker - 图像优化边缘函数
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 图像缓存键
    const cacheKey = new Request(url.toString(), request);
    const cache = caches.default;
    
    // 检查缓存
    let response = await cache.match(cacheKey);
    if (response) {
      return response;
    }

    // 图像优化参数
    const imageOptions = {
      quality: url.searchParams.get('q') || '85',
      format: url.searchParams.get('f') || 'auto',
      width: url.searchParams.get('w'),
      height: url.searchParams.get('h'),
      fit: url.searchParams.get('fit') || 'contain',
      dpr: url.searchParams.get('dpr') || '1'
    };

    // 智能格式选择
    const acceptHeader = request.headers.get('Accept') || '';
    if (acceptHeader.includes('image/avif')) {
      imageOptions.format = 'avif';
    } else if (acceptHeader.includes('image/webp')) {
      imageOptions.format = 'webp';
    }

    // 地理位置优化
    const country = request.cf?.country || 'US';
    const continent = request.cf?.continent || 'NA';
    
    // 中国大陆特殊处理
    if (country === 'CN') {
      // 使用中国境内CDN节点
      const chinaEdgeUrl = `https://china-cdn.yourdomain.com${url.pathname}`;
      response = await fetch(chinaEdgeUrl, {
        cf: {
          polish: 'lossless',
          mirage: true,
          cacheTtl: 86400
        }
      });
    } else {
      // 全球CDN处理
      response = await handleGlobalCDN(request, imageOptions, env);
    }

    // 添加性能头
    response = new Response(response.body, response);
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    response.headers.set('CDN-Cache-Control', 'max-age=31536000');
    response.headers.set('Cloudflare-CDN-Cache-Control', 'max-age=31536000');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Edge-Location', request.cf?.colo || 'unknown');
    response.headers.set('X-Country', country);

    // 存入缓存
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    
    return response;
  }
};

async function handleGlobalCDN(request, options, env) {
  const url = new URL(request.url);
  
  // 智能路由到最近的存储桶
  const closestBucket = await getClosestBucket(request.cf);
  
  // 从 R2 获取原始图像
  const objectKey = url.pathname.slice(1);
  const object = await env.R2_BUCKET.get(objectKey);
  
  if (!object) {
    return new Response('Image not found', { status: 404 });
  }

  // 应用 Cloudflare 图像优化
  const imageRequest = new Request(url.toString(), {
    cf: {
      image: {
        quality: parseInt(options.quality),
        format: options.format,
        width: options.width ? parseInt(options.width) : undefined,
        height: options.height ? parseInt(options.height) : undefined,
        fit: options.fit,
        dpr: parseFloat(options.dpr)
      }
    }
  });

  // 返回优化后的图像
  return fetch(imageRequest);
}

async function getClosestBucket(cf) {
  const regionMap = {
    'NA': 'us-east-1',
    'EU': 'eu-west-1',
    'AS': 'ap-southeast-1',
    'OC': 'ap-southeast-2',
    'SA': 'sa-east-1',
    'AF': 'eu-west-1'
  };
  
  return regionMap[cf?.continent] || 'us-east-1';
}

// Durable Object for Rate Limiting
export class RateLimiter {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const ip = request.headers.get('CF-Connecting-IP');
    const key = `rate_limit:${ip}`;
    
    const current = await this.state.storage.get(key) || 0;
    const limit = 100; // 每分钟100次请求
    
    if (current >= limit) {
      return new Response('Rate limit exceeded', { status: 429 });
    }
    
    await this.state.storage.put(key, current + 1);
    
    // 1分钟后重置
    await this.state.storage.setAlarm(Date.now() + 60000);
    
    return new Response('OK');
  }

  async alarm() {
    // 清除所有速率限制
    await this.state.storage.deleteAll();
  }
}