# AIGCBox - AI创意工具箱

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/aigcbox)

## 🎨 项目简介

AIGCBox 是一款专业的AI图像生成平台，提供100+创意工具模板，支持文本生图、图像编辑、风格转换等多种功能。基于Google Gemini 2.5 Flash技术，为创作者提供强大的AI创作能力。

### ✨ 核心功能

- **100+ 专业模板**: 涵盖人物、风景、产品、艺术等多个类别
- **文本生成图像**: 输入文字描述，AI自动生成精美图像
- **图像编辑增强**: 上传图片进行风格转换、细节优化
- **批量生成**: 支持多图同时生成，提高创作效率
- **实时预览**: 所见即所得的提示词编辑体验

## 🚀 快速开始

### 环境要求

- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器

### 安装步骤

1. 克隆项目
```bash
git clone https://github.com/yourusername/aigcbox.git
cd aigcbox
```

2. 安装依赖
```bash
npm install
# 或
yarn install
```

3. 配置环境变量
```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，添加您的 Gemini API Key：
```
GEMINI_API_KEY=your_api_key_here
```

获取 API Key：[https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000 查看应用

## 🌐 部署指南

### Vercel 部署（推荐）

1. Fork 本项目到您的 GitHub
2. 在 [Vercel](https://vercel.com) 注册账号
3. 导入 GitHub 项目
4. 配置环境变量：
   - `GEMINI_API_KEY`: 您的 Gemini API 密钥
5. 点击 Deploy 完成部署

### 自定义域名配置

部署完成后，在 Vercel 项目设置中添加自定义域名，然后在域名提供商处配置 DNS 记录。

## 🔧 技术栈

- **框架**: Next.js 15.5
- **UI**: React + Tailwind CSS
- **动画**: Framer Motion
- **AI服务**: Google Gemini API
- **类型检查**: TypeScript
- **代码规范**: ESLint
- **测试框架**: Jest + React Testing Library

## 📝 开发指南

### 项目结构

```
aigcbox/
├── src/
│   ├── app/          # Next.js App Router
│   │   ├── api/      # API 路由
│   │   └── page.tsx  # 主页面
│   └── lib/          # 工具函数和配置
│       ├── gemini.ts # AI 工具配置
│       └── utils.ts  # 通用工具
├── public/           # 静态资源
└── package.json      # 项目配置
```

### 添加新工具模板

在 `src/lib/gemini.ts` 中添加新的工具配置：

```typescript
{
  id: 'new-tool',
  name: '新工具名称',
  description: '工具描述',
  category: '分类',
  icon: IconComponent,
  promptTemplate: (custom, params) => {
    return `生成提示词模板 ${params.example}`;
  },
  parameters: {
    example: { 
      label: '参数名称', 
      placeholder: '参数提示' 
    }
  }
}
```

### 常用命令

```bash
npm run dev         # 启动开发服务器
npm run build       # 构建生产版本
npm run lint        # 代码检查
npm run type-check  # 类型检查
npm run test        # 运行测试
```

## 🌍 国内访问优化

为确保国内用户正常访问，建议：

1. 使用 CloudFlare CDN 加速
2. 配置合适的缓存策略
3. 启用 HTTPS 和 HTTP/2
4. 使用国内可访问的 DNS 服务器

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

- GitHub: [https://github.com/yourusername/aigcbox](https://github.com/yourusername/aigcbox)
- 网站: [https://aigc.jubao.ai](https://aigc.jubao.ai)

---

Made with ❤️ by AIGCBox Team