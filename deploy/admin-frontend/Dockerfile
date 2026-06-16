# ============================================================
# 管理后台前端 — 多阶段构建（bun）
# 构建阶段使用 Bun 编译 Next.js
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
# Docker 内无 git，跳过 husky prepare 等 lifecycle scripts
ENV HUSKY=0
RUN bun install --ignore-scripts

# ---------- 阶段2：构建 ----------
FROM oven/bun:1-alpine AS builder

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
RUN bun run build

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
