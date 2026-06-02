#!/bin/bash

if [ "$#" -lt 2 ]; then
  echo "用法: ./start <项目名...> <版本号>"
  echo "示例: ./start.sh backend 2.0.2"
  echo "示例: ./start.sh backend admin 2.0.2"
  exit 1
fi

VERSION="${@: -1}"
PROJECTS=("${@:1:$#-1}")

VERSION="$VERSION" docker compose -f docker-compose.test.yml stop "${PROJECTS[@]}" || true
VERSION="$VERSION" docker compose -f docker-compose.test.yml up -d "${PROJECTS[@]}"
