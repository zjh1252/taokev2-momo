# 创建 buildx builder（如果还没有的话）
docker buildx create --name multiarch --use --config .\buildkitd.toml

# 构建并推送 amd64 + arm64 双平台镜像
docker buildx build --platform linux/amd64,linux/arm64 -t 10.0.16.26:5000/taokev2/elasticsearch-with-ik-m:8.19.13 --push .




