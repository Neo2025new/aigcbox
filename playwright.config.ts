import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置文件
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  
  /* 并行运行测试文件 */
  fullyParallel: true,
  
  /* 在 CI 中如果没有测试失败则不重试 */
  forbidOnly: !!process.env.CI,
  
  /* 在 CI 中重试失败的测试 */
  retries: process.env.CI ? 2 : 0,
  
  /* 在 CI 中限制并发 worker */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter 配置 */
  reporter: [
    ['html'],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }],
  ],
  
  /* 全局测试配置 */
  use: {
    /* 基础 URL */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    /* 在失败时收集追踪信息 */
    trace: 'on-first-retry',
    
    /* 截图配置 */
    screenshot: 'only-on-failure',
    
    /* 视频录制 */
    video: 'retain-on-failure',
  },

  /* 配置不同的测试项目 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    /* 移动设备测试 */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    
    /* 品牌浏览器测试 */
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  /* 在测试开始前启动本地开发服务器 */
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  /* 全局设置和清理 */
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  /* 测试超时 */
  timeout: 30000,
  expect: {
    timeout: 10000,
  },

  /* 输出目录 */
  outputDir: './e2e/test-results',
});