#!/usr/bin/env bash
# ============================================================
# 一键构建 & 推送全部 Docker 镜像（amd64 + arm64 双架构）
#
# 用法：
#   ./build.sh <版本号>                    # 构建并推送所有镜像（默认环境）
#   ./build.sh <版本号> test               # 构建全部，使用 test 环境配置
#   ./build.sh <版本号> test backend       # 仅构建后端，test 环境
#   ./build.sh <版本号> backend            # 仅构建后端，默认环境
#   ./build.sh <版本号> test crawler       # 仅构建爬虫服务
#
# 环境参数会以 --build-arg BUILD_ENV=<env> 传递给 Dockerfile，
# 前端构建时自动加载 .env.<env> 文件中的变量。
#
# 可选环境变量：
#   BUILD_PLATFORMS — 默认 linux/amd64,linux/arm64
#
# 示例：
#   ./build.sh 1.0.1
#   ./build.sh 1.0.1 test
#   ./build.sh 1.0.1 test frontend
# ============================================================

set -euo pipefail

#REGISTRY="10.0.16.26:5000"
REGISTRY="10.0.14.20:5000"
IMAGE_PREFIX="taokev2"
BUILDER_NAME="taokev2-multiarch"
PLATFORMS="${BUILD_PLATFORMS:-linux/amd64,linux/arm64}"

KNOWN_TARGETS="backend frontend admin crawler nacos all"

# 格式：dockerfile|构建上下文（相对仓库根目录）
declare -A IMAGES=(
  [backend]="deploy/backend/Dockerfile|."
  [frontend]="deploy/frontend/Dockerfile|."
  [admin]="deploy/admin-frontend/Dockerfile|."
  [crawler]="crawler-service/Dockerfile|crawler-service"
  [nacos]="deploy/nacos/Dockerfile|."
)

# ---- 参数校验 ----
if [ -z "${1:-}" ]; then
  echo "错误：请指定版本号"
  echo "用法：./build.sh <版本号> [环境] [backend|frontend|admin|crawler]"
  exit 1
fi

VERSION="$1"

# 解析第二个参数：如果是已知目标则为 TARGET，否则为 BUILD_ENV
if echo "${KNOWN_TARGETS}" | grep -qw "${2:-}"; then
  BUILD_ENV=""
  TARGET="${2:-all}"
else
  BUILD_ENV="${2:-}"
  TARGET="${3:-all}"
fi

# 切换到仓库根目录（build.sh 在 deploy/ 下）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILDKIT_CONFIG="${SCRIPT_DIR}/buildkitd.toml"
cd "$REPO_ROOT"

ensure_buildx() {
  if ! docker buildx version >/dev/null 2>&1; then
    echo "错误：未检测到 docker buildx，请升级 Docker Desktop 并启用 buildx"
    exit 1
  fi

  if ! docker buildx inspect "${BUILDER_NAME}" >/dev/null 2>&1; then
    echo "创建 buildx builder: ${BUILDER_NAME}"
    PROXY_OPTS=()
    [ -n "${HTTP_PROXY:-}" ]  && PROXY_OPTS+=(--driver-opt "env.HTTP_PROXY=${HTTP_PROXY}")
    [ -n "${HTTPS_PROXY:-}" ] && PROXY_OPTS+=(--driver-opt "env.HTTPS_PROXY=${HTTPS_PROXY}")
    [ -n "${NO_PROXY:-}" ]    && PROXY_OPTS+=(--driver-opt "env.NO_PROXY=${NO_PROXY}")
    docker buildx create \
      --name "${BUILDER_NAME}" \
      --driver docker-container \
      --config "${BUILDKIT_CONFIG}" \
      "${PROXY_OPTS[@]}" \
      --use
    docker buildx inspect --bootstrap
  else
    docker buildx use "${BUILDER_NAME}"
  fi
}

parse_image() {
  local spec="$1"
  IMAGE_DOCKERFILE="${spec%%|*}"
  IMAGE_CONTEXT="${spec#*|}"
}

build_and_push() {
  local name="$1"
  local dockerfile="$2"
  local context="$3"
  local full_tag="${REGISTRY}/${IMAGE_PREFIX}/${name}:${VERSION}"
  local latest_tag="${REGISTRY}/${IMAGE_PREFIX}/${name}:latest"

  echo "-------- 构建并推送 ${name} --------"
  echo "平台: ${PLATFORMS}"
  echo "上下文: ${context}"
  echo "镜像标签: ${full_tag}"
  echo "         ${latest_tag}"

  docker buildx build \
    --platform "${PLATFORMS}" \
    -f "${dockerfile}" \
    --build-arg BUILD_ENV="${BUILD_ENV}" \
    -t "${full_tag}" \
    -t "${latest_tag}" \
    --push \
    "${context}"

  echo "✓ ${name} 完成"
  echo ""
}

echo "========================================"
echo "  淘课网 v2 — Docker 镜像构建"
echo "  版本：${VERSION}"
echo "  环境：${BUILD_ENV:-default}"
echo "  目标：${TARGET}"
echo "  平台：${PLATFORMS}"
echo "  仓库：${REGISTRY}"
echo "========================================"
echo ""

ensure_buildx

if [ "$TARGET" = "all" ]; then
  for name in backend frontend admin crawler; do
    parse_image "${IMAGES[$name]}"
    build_and_push "$name" "$IMAGE_DOCKERFILE" "$IMAGE_CONTEXT"
  done
else
  if [ -z "${IMAGES[$TARGET]+x}" ]; then
    echo "错误：未知目标 '${TARGET}'，可选值：backend / frontend / admin / crawler / nacos"
    exit 1
  fi
  # nacos 使用固定版本标签而非业务版本号
  if [ "$TARGET" = "nacos" ]; then
    VERSION="3.1.2"
  fi
  parse_image "${IMAGES[$TARGET]}"
  build_and_push "$TARGET" "$IMAGE_DOCKERFILE" "$IMAGE_CONTEXT"
fi

echo "========================================"
echo "  全部完成！版本 ${VERSION}"
echo "========================================"
