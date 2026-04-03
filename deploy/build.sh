#!/usr/bin/env bash
# ============================================================
# 一键构建 & 推送全部 Docker 镜像
#
# 用法：
#   ./build.sh <版本号>           # 构建并推送所有镜像
#   ./build.sh <版本号> backend   # 仅构建并推送后端
#   ./build.sh <版本号> frontend  # 仅构建并推送 C 端前端
#   ./build.sh <版本号> admin     # 仅构建并推送管理后台前端
#
# 示例：
#   ./build.sh 1.0.1
#   ./build.sh 1.0.1 backend
# ============================================================

set -euo pipefail

REGISTRY="10.0.16.26:5000"
IMAGE_PREFIX="taokev2"

# 镜像定义：名称  Dockerfile 路径
declare -A IMAGES=(
  [backend]="deploy/backend/Dockerfile"
  [frontend]="deploy/frontend/Dockerfile"
  [admin]="deploy/admin-frontend/Dockerfile"
)

# ---- 参数校验 ----
if [ -z "${1:-}" ]; then
  echo "错误：请指定版本号"
  echo "用法：./build.sh <版本号> [backend|frontend|admin]"
  exit 1
fi

VERSION="$1"
TARGET="${2:-all}"

# 切换到仓库根目录（build.sh 在 deploy/ 下）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

echo "========================================"
echo "  淘课网 v2 — Docker 镜像构建"
echo "  版本：${VERSION}"
echo "  仓库：${REGISTRY}"
echo "========================================"
echo ""

build_and_push() {
  local name="$1"
  local dockerfile="$2"
  local full_tag="${REGISTRY}/${IMAGE_PREFIX}-${name}:${VERSION}"
  local latest_tag="${REGISTRY}/${IMAGE_PREFIX}-${name}:latest"

  echo "-------- 构建 ${name} --------"
  echo "镜像标签: ${full_tag}"

  docker build \
    -f "${dockerfile}" \
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
    echo "错误：未知目标 '${TARGET}'，可选值：backend / frontend / admin"
    exit 1
  fi
  build_and_push "$TARGET" "${IMAGES[$TARGET]}"
fi

echo "========================================"
echo "  全部完成！版本 ${VERSION}"
echo "========================================"
