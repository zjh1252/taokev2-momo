# ============================================================
# C端前端 — 多阶段构建（pnpm）
# 构建阶段使用 Node 22 + pnpm 编译 Next.js
# 运行阶段使用精简 Node 镜像
#
# 构建参数：
#   BUILD_ENV — 环境名（test / prod 等），用于加载 .env.<env> 文件
#
# lan87 等 SELinux 构建机若仍 EPERM，可加：
#   docker build --security-opt seccomp=unconfined --security-opt label=disable ...
# ============================================================

ARG BUILD_ENV=""

# 构建阶段用 slim（Debian），Alpine 在部分 Docker+SELinux 环境易 EPERM
FROM node:22-slim AS deps

RUN mkdir -p /tmp/pnpm-store /tmp/home /tmp/npm-cache
ENV HOME=/tmp/home
ENV npm_config_cache=/tmp/npm-cache
RUN npm install -g pnpm@10.32.1

WORKDIR /app
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN printf "store-dir=/tmp/pnpm-store\npackage-import-method=copy\nnode-linker=hoisted\n" > .npmrc \
    && pnpm install --frozen-lockfile

# ---------- 阶段2：构建 ----------
FROM node:22-slim AS builder

RUN mkdir -p /tmp/home
ENV HOME=/tmp/home
RUN npm install -g pnpm@10.32.1

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
RUN pnpm run build

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
