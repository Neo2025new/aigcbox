# AIGCBox 完整部署指南

本指南将帮助您将 AIGCBox 项目部署到生产环境，配置自定义域名，并确保国内用户正常访问。

## 📋 准备工作

### 必需账号
- [ ] GitHub 账号
- [ ] Vercel 账号（免费）
- [ ] CloudFlare 账号（免费）
- [ ] Google AI Studio 账号（获取 Gemini API Key）

### 获取 Gemini API Key
1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 点击 "Create API Key"
3. 复制生成的密钥备用

## 🚀 步骤一：GitHub 仓库设置

### 1.1 创建新仓库

```bash
# 在项目根目录初始化 git
git init

# 添加所有文件
git add .

# 创建初始提交
git commit -m "Initial commit: AIGCBox platform"

# 添加远程仓库（替换为您的仓库地址）
git remote add origin https://github.com/YOUR_USERNAME/aigcbox.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 1.2 在 GitHub 网页端创建仓库

1. 登录 GitHub
2. 点击右上角 "+" → "New repository"
3. 仓库名称：`aigcbox`
4. 设置为 Public（公开）
5. 不要初始化 README（我们已有）
6. 点击 "Create repository"

## 📦 步骤二：Vercel 部署

### 2.1 连接 GitHub

1. 访问 [Vercel](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 "Add New" → "Project"

### 2.2 导入项目

1. 选择 "Import Git Repository"
2. 找到 `aigcbox` 仓库
3. 点击 "Import"

### 2.3 配置环境变量

在 "Environment Variables" 部分添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `GEMINI_API_KEY` | your_api_key | Gemini API 密钥 |
| `NEXT_PUBLIC_APP_URL` | https://aigc.jubao.ai | 您的域名 |

### 2.4 部署设置

- **Framework Preset**: Next.js（自动检测）
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

点击 "Deploy" 开始部署，等待 2-3 分钟完成。

## 🌐 步骤三：CloudFlare 域名配置

### 3.1 添加站点

1. 登录 [CloudFlare](https://cloudflare.com)
2. 点击 "Add a Site"
3. 输入您的域名：`jubao.ai`
4. 选择免费计划
5. CloudFlare 会扫描现有 DNS 记录

### 3.2 配置 DNS 记录

添加以下 DNS 记录：

| 类型 | 名称 | 内容 | 代理状态 |
|------|------|------|----------|
| CNAME | aigc | cname.vercel-dns.com | 已代理（橙色云朵） |
| CNAME | www.aigc | cname.vercel-dns.com | 已代理（橙色云朵） |

### 3.3 更新域名服务器

在您的域名注册商处，将 DNS 服务器更改为 CloudFlare 提供的：
- 例如：`xxx.ns.cloudflare.com`
- 例如：`yyy.ns.cloudflare.com`

等待 DNS 生效（通常 5-30 分钟）

### 3.4 CloudFlare 优化设置

#### SSL/TLS
- SSL/TLS 加密模式：完全（严格）
- 始终使用 HTTPS：开启
- 自动 HTTPS 重写：开启

#### 速度
- 自动缩小：开启（JavaScript、CSS、HTML）
- Brotli：开启
- 早期提示：开启
- HTTP/2：开启
- HTTP/3 (QUIC)：开启

#### 缓存
- 缓存级别：标准
- 浏览器缓存 TTL：4 小时
- 始终在线：开启

#### 网络
- WebSockets：开启
- IP 地理位置：开启

### 3.5 国内访问优化

#### 页面规则
创建页面规则：`aigc.jubao.ai/*`
- 缓存级别：缓存所有内容
- 边缘缓存 TTL：2 小时
- 浏览器缓存 TTL：30 分钟

#### 中国网络优化
如果有 CloudFlare 中国网络服务：
- 启用中国网络加速
- 选择最近的数据中心

## 🔗 步骤四：Vercel 自定义域名

### 4.1 添加域名

1. 在 Vercel 项目面板，点击 "Settings"
2. 选择 "Domains"
3. 输入：`aigc.jubao.ai`
4. 点击 "Add"

### 4.2 验证域名

Vercel 会自动检测 DNS 配置，显示：
- ✅ Valid Configuration

如果显示错误，请检查 CloudFlare DNS 设置。

## ✅ 步骤五：测试和验证

### 5.1 功能测试

```bash
# 测试主域名
curl -I https://aigc.jubao.ai

# 测试 API
curl https://aigc.jubao.ai/api/health
```

### 5.2 国内访问测试

使用以下工具测试：
- [站长工具](http://tool.chinaz.com/speedtest)
- [17CE](https://www.17ce.com)

### 5.3 SSL 证书验证

访问：https://aigc.jubao.ai
- 应该显示绿色锁标志
- 证书由 CloudFlare 签发

## 🔧 故障排除

### 常见问题

#### 1. 域名无法访问
- 检查 DNS 是否生效：`nslookup aigc.jubao.ai`
- 确认 CloudFlare 代理已开启（橙色云朵）
- 等待 DNS 传播（最多 48 小时）

#### 2. API 调用失败
- 检查 Vercel 环境变量是否正确设置
- 查看 Vercel 函数日志
- 确认 API Key 有效

#### 3. 国内访问慢
- 开启 CloudFlare 缓存
- 使用 CloudFlare APO（需付费）
- 考虑使用国内 CDN 服务

#### 4. HTTPS 证书错误
- CloudFlare SSL 模式设置为"完全（严格）"
- 等待证书自动生成（15 分钟）

## 📊 监控和维护

### Vercel Analytics
1. 在 Vercel 项目中启用 Analytics
2. 监控页面性能和用户访问

### CloudFlare Analytics
1. 查看流量分析
2. 监控缓存命中率
3. 查看安全事件

### 日志查看
```bash
# Vercel 函数日志
vercel logs --follow

# 查看构建日志
vercel logs --type build
```

## 🔄 更新部署

### 自动部署
每次推送到 GitHub main 分支，Vercel 会自动重新部署：

```bash
git add .
git commit -m "Update features"
git push origin main
```

### 手动部署
在 Vercel 面板点击 "Redeploy"

## 📱 移动端优化

### CloudFlare 移动优化
- Mirage：开启（优化图片加载）
- Polish：开启（图片压缩）
- Rocket Loader：谨慎使用（可能影响某些 JS）

## 🔐 安全建议

1. **API Key 安全**
   - 不要在代码中硬编码
   - 使用环境变量
   - 定期轮换密钥

2. **CloudFlare 安全**
   - 开启 DDoS 保护
   - 设置速率限制规则
   - 启用 Bot 对抗模式

3. **访问控制**
   - 可选：设置 IP 访问白名单
   - 可选：启用 CloudFlare Access

## 📞 支持

遇到问题？
- 查看 [Vercel 文档](https://vercel.com/docs)
- 查看 [CloudFlare 文档](https://developers.cloudflare.com)
- 提交 [GitHub Issue](https://github.com/yourusername/aigcbox/issues)

## 🎉 完成

恭喜！您的 AIGCBox 已成功部署到：
- 主域名：https://aigc.jubao.ai
- 备用域名：https://aigcbox.vercel.app

现在您可以：
1. 分享给用户使用
2. 继续开发新功能
3. 监控使用情况
4. 优化性能

---

最后更新：2024年