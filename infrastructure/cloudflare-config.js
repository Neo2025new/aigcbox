// Cloudflare 配置 - 与 Vercel 集成优化
export const cloudflareConfig = {
  // Cloudflare Pages 配置
  pages: {
    buildCommand: 'npm run build',
    buildOutputDirectory: '.next',
    compatibility_date: '2025-01-01',
    compatibility_flags: ['nodejs_compat'],
  },

  // Cloudflare Workers 配置 - 边缘函数
  workers: {
    // 图像处理边缘函数
    imageProcessor: {
      name: 'gemini-image-processor',
      routes: [
        'api.yourdomain.com/process/*',
        'cdn.yourdomain.com/images/*'
      ],
      kvNamespaces: [
        { binding: 'IMAGE_CACHE', id: 'your-kv-namespace-id' }
      ],
      durableObjects: {
        bindings: [
          { name: 'RATE_LIMITER', class_name: 'RateLimiter' }
        ]
      }
    }
  },

  // Cloudflare R2 存储配置
  r2: {
    buckets: {
      images: {
        name: 'gemini-images',
        lifecycle: {
          rules: [
            {
              id: 'delete-temp-images',
              status: 'Enabled',
              expiration: { days: 7 },
              filter: { prefix: 'temp/' }
            },
            {
              id: 'archive-old-images',
              status: 'Enabled',
              transitions: [
                {
                  days: 30,
                  storageClass: 'GLACIER'
                }
              ],
              filter: { prefix: 'generated/' }
            }
          ]
        }
      }
    }
  },

  // Cloudflare CDN 配置
  cdn: {
    cacheRules: [
      {
        match: '*.jpg|*.jpeg|*.png|*.gif|*.webp',
        cacheTTL: 31536000, // 1年
        cacheLevel: 'aggressive',
        edgeCacheTTL: 2592000 // 30天
      },
      {
        match: '_next/static/*',
        cacheTTL: 31536000,
        cacheLevel: 'aggressive'
      },
      {
        match: 'api/*',
        cacheTTL: 0,
        bypassCache: true
      }
    ],
    purgePatterns: [
      '/api/generate/*',
      '/temp/*'
    ]
  },

  // Cloudflare WAF 规则
  waf: {
    rules: [
      {
        name: 'Block suspicious image uploads',
        expression: 'http.request.uri.path contains "/api/generate" and http.request.body.size > 10485760',
        action: 'block'
      },
      {
        name: 'Rate limit API',
        expression: 'http.request.uri.path contains "/api/"',
        action: 'challenge',
        rateLimit: {
          threshold: 100,
          period: 60
        }
      }
    ]
  },

  // Cloudflare 负载均衡
  loadBalancing: {
    pools: [
      {
        name: 'vercel-pool',
        origins: [
          { name: 'vercel-primary', address: 'your-app.vercel.app', weight: 1 },
          { name: 'vercel-backup', address: 'your-app-backup.vercel.app', weight: 0.5 }
        ],
        check_regions: ['WNAM', 'ENAM', 'WEU', 'EEU', 'SEAS', 'NEAS'],
        minimum_origins: 1
      }
    ]
  },

  // 中国大陆优化
  chinaNetwork: {
    enabled: true,
    partner: 'JD Cloud', // 京东云合作
    regions: ['beijing', 'shanghai', 'guangzhou', 'chengdu'],
    icp_filing: 'required',
    features: {
      china_cache: true,
      china_waf: true,
      china_ddos: true
    }
  }
};