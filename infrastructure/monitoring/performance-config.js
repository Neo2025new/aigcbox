// 性能监控和优化配置
export const performanceConfig = {
  // Web Vitals 目标值
  webVitals: {
    LCP: { target: 2500, budget: 3000 }, // Largest Contentful Paint (ms)
    FID: { target: 100, budget: 200 },   // First Input Delay (ms)
    CLS: { target: 0.1, budget: 0.25 },  // Cumulative Layout Shift
    FCP: { target: 1500, budget: 2000 }, // First Contentful Paint (ms)
    TTFB: { target: 200, budget: 600 },  // Time to First Byte (ms)
    INP: { target: 200, budget: 500 }    // Interaction to Next Paint (ms)
  },

  // 资源性能预算
  performanceBudget: {
    javascript: {
      total: 350,      // KB
      initial: 100,    // 初始加载
      lazy: 250        // 懒加载
    },
    css: {
      total: 60,       // KB
      critical: 20,    // 关键CSS
      nonCritical: 40  // 非关键CSS
    },
    images: {
      total: 1000,     // KB per page
      hero: 250,       // 主图
      thumbnail: 50    // 缩略图
    },
    fonts: {
      total: 100,      // KB
      subset: true     // 字体子集
    }
  },

  // 监控配置
  monitoring: {
    // Vercel Analytics
    vercel: {
      enabled: true,
      webVitals: true,
      customEvents: [
        'image_generation_start',
        'image_generation_complete',
        'api_error',
        'cache_hit',
        'cache_miss'
      ]
    },

    // Google Analytics 4
    ga4: {
      enabled: true,
      measurementId: 'G-XXXXXXXXXX',
      events: {
        image_generated: {
          parameters: ['prompt_type', 'generation_time', 'model_used']
        },
        performance_metric: {
          parameters: ['metric_name', 'value', 'page_path']
        }
      }
    },

    // 自定义监控
    custom: {
      endpoint: '/api/metrics',
      interval: 30000, // 30秒
      metrics: [
        'memory_usage',
        'cpu_usage',
        'request_count',
        'error_rate',
        'cache_hit_ratio'
      ]
    }
  },

  // 性能优化策略
  optimization: {
    // 代码分割
    codeSplitting: {
      enabled: true,
      strategy: 'route-based',
      chunks: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          priority: 10
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true
        }
      }
    },

    // 预加载策略
    preloading: {
      critical: [
        '/fonts/inter-var.woff2',
        '/_next/static/css/app.css'
      ],
      prefetch: [
        '/api/health',
        '/images/logo.svg'
      ],
      dns_prefetch: [
        'https://generativelanguage.googleapis.com',
        'https://cdn.yourdomain.com'
      ]
    },

    // 图像优化
    imageOptimization: {
      formats: ['avif', 'webp', 'jpg'],
      sizes: {
        mobile: 640,
        tablet: 1024,
        desktop: 1920,
        retina: 3840
      },
      quality: {
        high: 90,
        medium: 75,
        low: 60
      },
      lazy: true,
      placeholder: 'blur'
    },

    // 缓存策略
    caching: {
      browser: {
        static: 31536000,    // 1年
        images: 604800,      // 7天
        api: 0,             // 不缓存
        html: 3600          // 1小时
      },
      cdn: {
        static: 31536000,
        images: 86400,      // 1天
        api: 0
      },
      serviceWorker: {
        enabled: true,
        strategies: {
          static: 'CacheFirst',
          images: 'StaleWhileRevalidate',
          api: 'NetworkFirst'
        }
      }
    }
  },

  // 实时用户监控 (RUM)
  rum: {
    enabled: true,
    sampleRate: 0.1, // 10% 采样率
    
    // 性能指标收集
    collectMetrics: {
      navigation: true,
      resource: true,
      paint: true,
      longtask: true,
      cls: true,
      fid: true,
      lcp: true
    },

    // 错误追踪
    errorTracking: {
      enabled: true,
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured'
      ],
      sampleRate: 1.0 // 100% 错误采样
    },

    // 会话回放
    sessionReplay: {
      enabled: false, // 隐私考虑
      maskAllInputs: true,
      blockAllMedia: false
    }
  },

  // 告警规则
  alerts: {
    rules: [
      {
        name: 'High TTFB',
        metric: 'ttfb',
        condition: '> 600',
        duration: '5m',
        severity: 'warning'
      },
      {
        name: 'Poor LCP',
        metric: 'lcp',
        condition: '> 4000',
        duration: '5m',
        severity: 'critical'
      },
      {
        name: 'High Error Rate',
        metric: 'error_rate',
        condition: '> 0.05',
        duration: '1m',
        severity: 'critical'
      },
      {
        name: 'Low Cache Hit Rate',
        metric: 'cache_hit_rate',
        condition: '< 0.7',
        duration: '10m',
        severity: 'warning'
      }
    ],
    
    channels: {
      slack: {
        webhook: process.env.SLACK_WEBHOOK_URL,
        channel: '#alerts'
      },
      email: {
        recipients: ['ops@example.com'],
        smtp: process.env.SMTP_SERVER
      },
      pagerduty: {
        serviceKey: process.env.PAGERDUTY_KEY,
        severity_mapping: {
          warning: 'info',
          critical: 'critical'
        }
      }
    }
  },

  // A/B测试配置
  abTesting: {
    enabled: true,
    experiments: [
      {
        name: 'image_quality_test',
        variants: {
          control: { quality: 85 },
          variant_a: { quality: 75 },
          variant_b: { quality: 95 }
        },
        allocation: [0.34, 0.33, 0.33],
        metrics: ['generation_time', 'user_satisfaction', 'bandwidth_usage']
      }
    ]
  },

  // 性能报告
  reporting: {
    weekly: {
      enabled: true,
      recipients: ['team@example.com'],
      metrics: [
        'p50_response_time',
        'p95_response_time',
        'p99_response_time',
        'error_rate',
        'availability',
        'apdex_score'
      ]
    },
    
    monthly: {
      enabled: true,
      recipients: ['management@example.com'],
      includesCostAnalysis: true,
      includesTrends: true
    }
  }
};

// 性能监控中间件
export function performanceMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  
  // 记录请求开始
  const requestId = generateRequestId();
  req.requestId = requestId;
  
  // 响应完成后记录指标
  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1000000; // 转换为毫秒
    
    // 发送指标
    sendMetrics({
      requestId,
      path: req.path,
      method: req.method,
      statusCode: res.statusCode,
      duration,
      timestamp: Date.now()
    });
  });
  
  next();
}

// 客户端性能监控脚本
export const clientPerformanceScript = `
(function() {
  // Web Vitals 监控
  if ('PerformanceObserver' in window) {
    // LCP
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        sendMetric('LCP', entry.startTime);
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    
    // FID
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        sendMetric('FID', entry.processingStart - entry.startTime);
      }
    }).observe({ type: 'first-input', buffered: true });
    
    // CLS
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          sendMetric('CLS', clsValue);
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  }
  
  // 发送指标到服务器
  function sendMetric(name, value) {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/metrics', JSON.stringify({
        metric: name,
        value: value,
        url: window.location.href,
        timestamp: Date.now()
      }));
    }
  }
})();
`;