#!/usr/bin/env bash
# ============================================================
# 一键构建 & 推送全部 Docker 镜像
#
# 用法：
#   ./build.sh <版本号>                    # 构建并推送所有镜像（默认环境）
#   ./build.sh <版本号> test               # 构建全部，使用 test 环境配置
#   ./build.sh <版本号> test backend       # 仅构建后端，test 环境
#   ./build.sh <版本号> backend            # 仅构建后端，默认环境
#
# 环境参数会以 --build-arg BUILD_ENV=<env> 传递给 Dockerfile，
# 前端构建时自动加载 .env.<env> 文件中的变量。
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

KNOWN_TARGETS="backend frontend admin nacos all"

declare -A IMAGES=(
  [backend]="deploy/backend/Dockerfile"
  [frontend]="deploy/frontend/Dockerfile"
  [admin]="deploy/admin-frontend/Dockerfile"
  [nacos]="deploy/nacos/Dockerfile"
)

# ---- 参数校验 ----
if [ -z "${1:-}" ]; then
  echo "错误：请指定版本号"
  echo "用法：./build.sh <版本号> [环境] [backend|frontend|admin]"
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
cd "$REPO_ROOT"

echo "========================================"
echo "  淘课网 v2 — Docker 镜像构建"
echo "  版本：${VERSION}"
echo "  环境：${BUILD_ENV:-default}"
echo "  目标：${TARGET}"
echo "  仓库：${REGISTRY}"
echo "========================================"
echo ""

build_and_push() {
  local name="$1"
  local dockerfile="$2"
  local full_tag="${REGISTRY}/${IMAGE_PREFIX}/${name}:${VERSION}"
  local latest_tag="${REGISTRY}/${IMAGE_PREFIX}/${name}:latest"

  echo "-------- 构建 ${name} --------"
  echo "镜像标签: ${full_tag}"

  docker build \
    -f "${dockerfile}" \
    --build-arg BUILD_ENV="${BUILD_ENV}" \
    -t "${full_tag}" \
    -t "${latest_tag}" \
    .

  echo "-------- 推送 ${name} --------"
  docker push "${full_tag}"
  docker push "${latest_tag}"

  echo "✓ ${name} 完成"
  echo ""
}

if [ "$TARGET" = "all" ]; then
  for name in backend frontend admin; do
    build_and_push "$name" "${IMAGES[$name]}"
  done
else
  if [ -z "${IMAGES[$TARGET]+x}" ]; then
    echo "错误：未知目标 '${TARGET}'，可选值：backend / frontend / admin / nacos"
    exit 1
  fi
  # nacos 使用固定版本标签而非业务版本号
  if [ "$TARGET" = "nacos" ]; then
    VERSION="3.1.2"
  fi
  build_and_push "$TARGET" "${IMAGES[$TARGET]}"
fi

echo "========================================"
echo "  全部完成！版本 ${VERSION}"
echo "========================================"
