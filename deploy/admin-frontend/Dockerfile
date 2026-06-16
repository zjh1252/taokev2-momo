# ============================================================
# 管理后台前端 — 多阶段构建（bun 装依赖 + node 构建）
# 构建阶段使用 Bun 安装依赖、Node 执行 next build
# 运行阶段使用精简 Node 镜像
#
# 构建参数：
#   BUILD_ENV — 环境名（test / prod 等），用于加载 .env.<env> 文件
# ============================================================

ARG BUILD_ENV=""

# ---------- 阶段1：依赖安装 ----------
FROM oven/bun:1-alpine AS deps

WORKDIR /app
COPY admin-frontend/package.json admin-frontend/bun.lock ./
# Docker 无 git：去掉 husky prepare，但保留 next 等 postinstall
RUN bun -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json'));delete p.scripts.prepare;fs.writeFileSync('package.json',JSON.stringify(p,null,2));"
RUN bun install --frozen-lockfile

# ---------- 阶段2：构建 ----------
FROM node:22-slim AS builder

ARG BUILD_ENV

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY admin-frontend/ ./

# 按环境加载 .env 文件：.env.<BUILD_ENV> -> .env.local
RUN if [ -n "$BUILD_ENV" ] && [ -f ".env.${BUILD_ENV}" ]; then \
      cp ".env.${BUILD_ENV}" .env.local; \
      echo "=> 已加载 .env.${BUILD_ENV}"; \
    fi

ENV NEXT_TELEMETRY_DISABLED=1
ENV BUILD_STANDALONE=true
RUN npm run build

# ---------- 阶段3：运行镜像 ----------
FROM node:22-alpine

LABEL maintainer="Fangxinxin"
LABEL description="淘课网 v2 管理后台前端"

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TZ=Asia/Shanghai

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
