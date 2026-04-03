# ============================================================
# C端前端 — 多阶段构建
# 构建阶段使用 Node 22 编译 Next.js
# 运行阶段使用精简 Node 镜像
#
# 构建参数：
#   BUILD_ENV — 环境名（test / prod 等），用于加载 .env.<env> 文件
# ============================================================

ARG BUILD_ENV=""

# ---------- 阶段1：依赖安装 ----------
FROM node:22-alpine AS deps

WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --prefer-offline 2>/dev/null || npm install

# ---------- 阶段2：构建 ----------
FROM node:22-alpine AS builder

ARG BUILD_ENV

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ ./

# 按环境加载 .env 文件：.env.<BUILD_ENV> -> .env.local
RUN if [ -n "$BUILD_ENV" ] && [ -f ".env.${BUILD_ENV}" ]; then \
      cp ".env.${BUILD_ENV}" .env.local; \
      echo "=> 已加载 .env.${BUILD_ENV}"; \
    fi

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- 阶段3：运行镜像 ----------
FROM node:22-alpine

LABEL maintainer="Fangxinxin"
LABEL description="淘课网 v2 C端前端"

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TZ=Asia/Shanghai

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
