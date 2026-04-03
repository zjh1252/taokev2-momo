# ============================================================
# 管理后台前端 — 多阶段构建
# 构建阶段使用 Node 22 编译 Next.js
# 运行阶段使用精简 Node 镜像
# ============================================================

# ---------- 阶段1：依赖安装 ----------
FROM node:22-alpine AS deps

WORKDIR /app
COPY admin-frontend/package.json admin-frontend/package-lock.json* ./
RUN npm ci --prefer-offline 2>/dev/null || npm install

# ---------- 阶段2：构建 ----------
FROM node:22-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY admin-frontend/ ./

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
