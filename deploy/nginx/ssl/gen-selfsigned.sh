#!/bin/bash

set -e

echo "开始生成自签证书..."

# 确保在脚本所在目录执行
cd "$(dirname "$0")"

# 删除旧文件
rm -f taoke-selfsigned.key taoke-selfsigned.crt

# 生成证书（带 SAN，兼容 Chrome / Safari）
openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout taoke-selfsigned.key \
  -out taoke-selfsigned.crt \
  -subj "/C=CN/ST=Test/L=Test/O=Taoke/OU=Dev/CN=taoke.com" \
  -addext "subjectAltName=DNS:taoke.com,DNS:v2.taoke.com,DNS:adminv2.taoke.com"

# 设置权限
chmod 600 taoke-selfsigned.key

echo "✅ 证书生成完成："
echo " - taoke-selfsigned.crt"
echo " - taoke-selfsigned.key"
