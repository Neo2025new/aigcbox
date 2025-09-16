# 🚀 AIGCBox 快速部署指南

## ✅ 已完成的工作

1. ✅ 项目重命名为 AIGCBox
2. ✅ 清理不必要的文件
3. ✅ 更新所有文档
4. ✅ 初始化Git仓库并提交代码
5. ✅ 创建详细的部署文档

## 📋 接下来您需要做的

### 1️⃣ 推送到 GitHub（5分钟）

```bash
# 1. 在 GitHub 创建新仓库
# 访问: https://github.com/new
# 仓库名: aigcbox
# 设置为 Public
# 不要初始化 README

# 2. 在本地项目目录执行：
git remote add origin https://github.com/YOUR_USERNAME/aigcbox.git
git push -u origin main
```

### 2️⃣ 部署到 Vercel（10分钟）

1. **登录 Vercel**
   - 访问 https://vercel.com
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "Add New" → "Project"
   - 选择刚创建的 `aigcbox` 仓库
   - 点击 "Import"

3. **配置环境变量**
   添加以下环境变量：
   ```
   GEMINI_API_KEY = 您的API密钥
   ```
   
   获取API Key: https://aistudio.google.com/app/apikey

4. **点击 Deploy**
   等待2-3分钟完成部署

### 3️⃣ 配置自定义域名（15分钟）

#### CloudFlare 设置

1. **登录 CloudFlare**
   - https://cloudflare.com
   - 添加站点 `jubao.ai`

2. **添加 DNS 记录**
   | 类型 | 名称 | 内容 |
   |-----|------|------|
   | CNAME | aigc | cname.vercel-dns.com |
   | CNAME | www.aigc | cname.vercel-dns.com |

3. **更新域名DNS服务器**
   在您的域名注册商处更新为CloudFlare提供的DNS

#### Vercel 设置

1. 在 Vercel 项目设置中
2. 选择 "Domains"
3. 添加 `aigc.jubao.ai`
4. 等待验证通过

### 4️⃣ 测试访问（5分钟）

```bash
# 测试部署
curl -I https://aigcbox.vercel.app

# 测试自定义域名（DNS生效后）
curl -I https://aigc.jubao.ai
```

## 🔑 重要信息

### 环境变量
确保在 Vercel 中设置：
- `GEMINI_API_KEY`: 您的 Gemini API 密钥

### 本地开发
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 项目结构
```
aigcbox/
├── src/app/        # 主应用
├── src/lib/        # 工具库和配置
├── src/components/ # UI组件
├── public/         # 静态资源
└── package.json    # 项目配置
```

## 🆘 需要帮助？

### 常见问题

**Q: 域名无法访问？**
A: 检查CloudFlare DNS是否正确配置，等待DNS生效（最多48小时）

**Q: API调用失败？**
A: 检查Vercel环境变量中的 GEMINI_API_KEY 是否正确

**Q: 部署失败？**
A: 查看Vercel构建日志，确保所有依赖正确安装

### 详细文档
- 完整部署指南：查看 `DEPLOY_GUIDE.md`
- 项目说明：查看 `README.md`

## 📝 检查清单

- [ ] GitHub 仓库已创建
- [ ] 代码已推送到 GitHub
- [ ] Vercel 项目已导入
- [ ] 环境变量已配置
- [ ] 部署成功
- [ ] CloudFlare DNS 已配置
- [ ] 自定义域名已添加到 Vercel
- [ ] 网站可以正常访问

## 🎉 完成！

恭喜！您的 AIGCBox 平台即将上线。

预计总用时：30-45分钟
- GitHub: 5分钟
- Vercel: 10分钟
- CloudFlare: 15分钟
- DNS生效: 5-30分钟

---

如有问题，请查看 `DEPLOY_GUIDE.md` 获取更详细的说明。