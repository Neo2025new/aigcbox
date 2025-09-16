/**
 * 性能测试脚本
 * 使用 Puppeteer 和 Lighthouse 进行自动化性能测试
 * 
 * 安装依赖：
 * npm install --save-dev puppeteer lighthouse chrome-launcher
 * 
 * 运行：
 * node scripts/performance-test.js
 */

const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// 测试配置
const TEST_URL = process.env.TEST_URL || 'http://localhost:3000';
const RUNS = 3; // 运行次数，取平均值

// Lighthouse 配置
const lighthouseConfig = {
  logLevel: 'info',
  output: 'html',
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  throttling: {
    rttMs: 150,
    throughputKbps: 1638.4,
    cpuSlowdownMultiplier: 4,
  },
};

// 性能预算
const performanceBudgets = {
  'first-contentful-paint': 1800,
  'largest-contentful-paint': 2500,
  'first-input-delay': 100,
  'cumulative-layout-shift': 0.1,
  'time-to-first-byte': 800,
  'total-blocking-time': 300,
  'speed-index': 3400,
};

async function runLighthouse(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    ...lighthouseConfig,
    port: chrome.port,
  };
  
  const runnerResult = await lighthouse(url, options);
  
  await chrome.kill();
  
  return runnerResult;
}

async function runPuppeteerTest(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // 设置视口
  await page.setViewport({ width: 1920, height: 1080 });
  
  // 启用性能监控
  await page.evaluateOnNewDocument(() => {
    window.performanceMetrics = {
      renderTime: 0,
      scriptTime: 0,
      layoutTime: 0,
    };
    
    // 监控渲染时间
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'paint') {
          window.performanceMetrics.renderTime = entry.startTime;
        } else if (entry.entryType === 'measure') {
          if (entry.name.includes('script')) {
            window.performanceMetrics.scriptTime += entry.duration;
          } else if (entry.name.includes('layout')) {
            window.performanceMetrics.layoutTime += entry.duration;
          }
        }
      }
    });
    
    observer.observe({ entryTypes: ['paint', 'measure'] });
  });
  
  // 导航到页面
  const startTime = Date.now();
  await page.goto(url, { waitUntil: 'networkidle2' });
  const loadTime = Date.now() - startTime;
  
  // 获取性能指标
  const metrics = await page.metrics();
  const performanceMetrics = await page.evaluate(() => window.performanceMetrics);
  
  // 获取资源加载信息
  const resourceTimings = await page.evaluate(() =>
    JSON.stringify(performance.getEntriesByType('resource'))
  );
  const resources = JSON.parse(resourceTimings);
  
  // 计算资源统计
  const resourceStats = resources.reduce((acc, resource) => {
    const type = resource.initiatorType;
    if (!acc[type]) {
      acc[type] = { count: 0, size: 0, duration: 0 };
    }
    acc[type].count++;
    acc[type].duration += resource.duration;
    return acc;
  }, {});
  
  // 获取内存使用
  const memoryUsage = await page.evaluate(() => {
    if (performance.memory) {
      return {
        usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1048576),
        totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1048576),
      };
    }
    return null;
  });
  
  await browser.close();
  
  return {
    loadTime,
    metrics,
    performanceMetrics,
    resourceStats,
    memoryUsage,
  };
}

async function runTests() {
  console.log(`🚀 开始性能测试 (URL: ${TEST_URL})\n`);
  
  const results = {
    lighthouse: [],
    puppeteer: [],
  };
  
  // 运行多次测试
  for (let i = 0; i < RUNS; i++) {
    console.log(`📊 运行第 ${i + 1}/${RUNS} 次测试...`);
    
    // Lighthouse 测试
    console.log('  运行 Lighthouse...');
    const lighthouseResult = await runLighthouse(TEST_URL);
    results.lighthouse.push(lighthouseResult.lhr);
    
    // Puppeteer 测试
    console.log('  运行 Puppeteer...');
    const puppeteerResult = await runPuppeteerTest(TEST_URL);
    results.puppeteer.push(puppeteerResult);
    
    console.log('  ✅ 完成\n');
  }
  
  // 计算平均值
  const avgLighthouse = calculateLighthouseAverage(results.lighthouse);
  const avgPuppeteer = calculatePuppeteerAverage(results.puppeteer);
  
  // 生成报告
  generateReport(avgLighthouse, avgPuppeteer);
}

function calculateLighthouseAverage(results) {
  const avg = {
    scores: {},
    metrics: {},
  };
  
  // 计算分数平均值
  const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
  categories.forEach(category => {
    const scores = results.map(r => r.categories[category].score);
    avg.scores[category] = (scores.reduce((a, b) => a + b, 0) / scores.length * 100).toFixed(1);
  });
  
  // 计算指标平均值
  const metrics = [
    'first-contentful-paint',
    'largest-contentful-paint',
    'total-blocking-time',
    'cumulative-layout-shift',
    'speed-index',
  ];
  
  metrics.forEach(metric => {
    const values = results.map(r => r.audits[metric].numericValue);
    avg.metrics[metric] = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  });
  
  return avg;
}

function calculatePuppeteerAverage(results) {
  const avg = {
    loadTime: 0,
    memoryUsage: { usedJSHeapSize: 0, totalJSHeapSize: 0 },
    resourceStats: {},
  };
  
  // 计算加载时间平均值
  avg.loadTime = Math.round(
    results.reduce((sum, r) => sum + r.loadTime, 0) / results.length
  );
  
  // 计算内存使用平均值
  if (results[0].memoryUsage) {
    avg.memoryUsage.usedJSHeapSize = Math.round(
      results.reduce((sum, r) => sum + r.memoryUsage.usedJSHeapSize, 0) / results.length
    );
    avg.memoryUsage.totalJSHeapSize = Math.round(
      results.reduce((sum, r) => sum + r.memoryUsage.totalJSHeapSize, 0) / results.length
    );
  }
  
  return avg;
}

function generateReport(lighthouse, puppeteer) {
  console.log('\n' + '='.repeat(60));
  console.log('📈 性能测试报告');
  console.log('='.repeat(60) + '\n');
  
  // Lighthouse 分数
  console.log('🏆 Lighthouse 分数:');
  console.log(`  性能: ${lighthouse.scores.performance}%`);
  console.log(`  可访问性: ${lighthouse.scores.accessibility}%`);
  console.log(`  最佳实践: ${lighthouse.scores['best-practices']}%`);
  console.log(`  SEO: ${lighthouse.scores.seo}%`);
  console.log('');
  
  // 核心 Web Vitals
  console.log('📊 核心 Web Vitals:');
  const fcp = lighthouse.metrics['first-contentful-paint'];
  const lcp = lighthouse.metrics['largest-contentful-paint'];
  const cls = lighthouse.metrics['cumulative-layout-shift'];
  const tbt = lighthouse.metrics['total-blocking-time'];
  
  console.log(`  FCP: ${fcp}ms ${getStatus(fcp, performanceBudgets['first-contentful-paint'])}`);
  console.log(`  LCP: ${lcp}ms ${getStatus(lcp, performanceBudgets['largest-contentful-paint'])}`);
  console.log(`  CLS: ${cls} ${getStatus(cls, performanceBudgets['cumulative-layout-shift'])}`);
  console.log(`  TBT: ${tbt}ms ${getStatus(tbt, performanceBudgets['total-blocking-time'])}`);
  console.log('');
  
  // Puppeteer 指标
  console.log('⚡ 加载性能:');
  console.log(`  页面加载时间: ${puppeteer.loadTime}ms`);
  if (puppeteer.memoryUsage) {
    console.log(`  JS堆使用: ${puppeteer.memoryUsage.usedJSHeapSize}MB / ${puppeteer.memoryUsage.totalJSHeapSize}MB`);
  }
  console.log('');
  
  // 性能建议
  console.log('💡 优化建议:');
  const suggestions = [];
  
  if (fcp > performanceBudgets['first-contentful-paint']) {
    suggestions.push('- 优化首次内容绘制时间：减少阻塞渲染的资源');
  }
  if (lcp > performanceBudgets['largest-contentful-paint']) {
    suggestions.push('- 优化最大内容绘制：优化图片加载，使用CDN');
  }
  if (cls > performanceBudgets['cumulative-layout-shift']) {
    suggestions.push('- 减少布局偏移：为图片和广告预留空间');
  }
  if (tbt > performanceBudgets['total-blocking-time']) {
    suggestions.push('- 减少阻塞时间：分割长任务，使用Web Workers');
  }
  
  if (suggestions.length > 0) {
    suggestions.forEach(s => console.log(s));
  } else {
    console.log('  ✅ 所有指标都在预算范围内！');
  }
  
  console.log('\n' + '='.repeat(60));
  
  // 保存详细报告
  const reportData = {
    timestamp: new Date().toISOString(),
    url: TEST_URL,
    lighthouse,
    puppeteer,
    suggestions,
  };
  
  const reportPath = path.join(__dirname, `../performance-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\n📁 详细报告已保存至: ${reportPath}`);
}

function getStatus(value, budget) {
  if (value <= budget) {
    return '✅';
  } else if (value <= budget * 1.5) {
    return '⚠️';
  } else {
    return '❌';
  }
}

// 运行测试
runTests().catch(console.error);