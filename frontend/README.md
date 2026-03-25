# 淘课网 v2 — 前端项目

企业培训采购平台前端，基于 Next.js App Router 构建，提供 SSR 公开页面（课程、讲师、文章等）与客户端交互的登录后功能（用户中心、课程管理等）。

## 技术栈

- **框架**：Next.js ^16（App Router）
- **语言**：TypeScript ^5.x
- **样式**：Tailwind CSS ^4.x
- **组件库**：shadcn-ui
- **国际化**：next-intl ^4.x
- **包管理器**：pnpm ^9.x

## 环境要求

- Node.js >= 22 LTS
- pnpm >= 9

## 快速开始

```bash
# 安装依赖
pnpm install

# 复制环境变量（首次需要）
cp .env.example .env.local

# 启动开发服务器
pnpm dev
```

开发服务器默认运行在 `http://localhost:3000`。

## 常用命令

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 生产构建
pnpm start        # 启动生产服务
pnpm lint         # ESLint 检查
```

## 项目结构

业务代码位于 `src/` 目录下，详细架构说明参见 `/docs/04-前端架构设计.md`。

## 环境变量

参考 `.env.example` 配置必要的环境变量。核心变量：

- `NEXT_PUBLIC_API_BASE_URL` — 后端 API 地址
- `NEXT_PUBLIC_CDN_BASE_URL` — CDN 资源地址（可选）
