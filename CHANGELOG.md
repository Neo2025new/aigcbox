# 更新日志

## [1.1.0] - 2025-09-16

### 🎯 质量改进
- 修复 ESLint useEffect 依赖警告
- 完善 Jest 测试基础设施配置
- 添加 TypeScript 类型定义支持

### 🔒 安全增强
- 优化日志输出：敏感信息仅在开发环境显示
- 改进速率限制：移除 setInterval，兼容 serverless 环境
- 修复内存泄漏：为 URL.createObjectURL 添加正确的清理逻辑

### 🛠 技术优化
- 速率限制器改为按需清理机制，提升 serverless 兼容性
- 图片上传组件添加内存管理，防止内存泄漏
- 所有验证脚本通过（lint, type-check, test, build）

### 📦 依赖更新
- 新增 jest @testing-library/react @testing-library/jest-dom
- 新增 @types/jest 类型定义
- 新增 jest-environment-jsdom 测试环境

### 📋 开发体验
- 改进测试配置：修复 moduleNameMapper 配置错误
- 优化构建流程：所有质量检查通过
- 提升代码质量：符合 ESLint 和 TypeScript 严格模式

## [1.0.0] - 2025-09-15

### ✨ 初始版本
- 119 种 AI 图像生成工具
- 支持文本生图和图像编辑
- 历史记录和今日创作库功能
- 响应式设计，支持移动端
- Gemini API 集成
- 安全加固版本 API 路由