# ============================================================
# 推送入口（本地）：vpn.taoke.com:19810（HTTP 明文，经 VPN 访问，与内网 registry 同一个仓库）
# 内网服务器拉取仍用 10.0.14.20:5000（docker-compose.test.yml 不改），
# 二者指向同一 registry，按仓库路径 taokev2/xxx 对应同一镜像。
#
# 私有仓库是 HTTP，两处都要配 insecure，缺一不可：
#   1) buildx 构建/推送：靠本目录 buildkitd.toml（在 buildx create 时注入）
#   2) 普通 docker pull/tag/push：靠 Docker daemon 的 insecure-registries
#      Docker Desktop → Settings → Docker Engine，daemon.json 加：
#        "insecure-registries": ["vpn.taoke.com:19810"]
#      改完 Apply & Restart。
# 注意：改了 buildkitd.toml（比如换地址）后，必须删掉 builder 重建才生效！
#       否则 buildx 仍按旧配置走 HTTPS，报 Head "https://.../..." EOF。
# ============================================================

# 多平台构建必须用 docker-container 驱动的 builder（默认的 docker 驱动不支持多平台）
# 1) （重）创建并启用 builder —— 改过 buildkitd.toml 后先删再建
docker buildx rm multiarch
docker buildx create --name multiarch --driver docker-container --use --config .\buildkitd.toml

# 2) 引导并确认 builder 已就绪（看到 Platforms 含 linux/amd64, linux/arm64 即可）
docker buildx inspect --bootstrap

# 3) 构建并推送 amd64 + arm64 双平台镜像（带 IK 的 ES）
docker buildx build --platform linux/amd64,linux/arm64 -t vpn.taoke.com:19810/taokev2/elasticsearch-with-ik-m:8.19.13 --push .


# ============================================================
# 搬运 compose 里依赖的官方镜像到私有仓库（kibana / es-setup 用的纯 ES）
# 方式 A：保留多平台 manifest（推荐，用上面建好的 multiarch builder，走 buildkitd.toml 的 insecure 配置）
docker buildx imagetools create --tag vpn.taoke.com:19810/taokev2/elasticsearch:8.19.13 docker.elastic.co/elasticsearch/elasticsearch:8.19.13
docker buildx imagetools create --tag vpn.taoke.com:19810/taokev2/kibana:8.19.13        docker.elastic.co/kibana/kibana:8.19.13

# 方式 B：只搬当前主机架构（更简单，依赖 daemon 的 insecure-registries 配置）
#   docker pull docker.elastic.co/elasticsearch/elasticsearch:8.19.13
#   docker tag  docker.elastic.co/elasticsearch/elasticsearch:8.19.13 vpn.taoke.com:19810/taokev2/elasticsearch:8.19.13
#   docker push vpn.taoke.com:19810/taokev2/elasticsearch:8.19.13
#   docker pull docker.elastic.co/kibana/kibana:8.19.13
#   docker tag  docker.elastic.co/kibana/kibana:8.19.13 vpn.taoke.com:19810/taokev2/kibana:8.19.13
#   docker push vpn.taoke.com:19810/taokev2/kibana:8.19.13

# 推完确认是双平台：
#   docker buildx imagetools inspect vpn.taoke.com:19810/taokev2/elasticsearch-with-ik-m:8.19.13


# 构建其他镜像的时候 切换回 default 环境
docker context use default
docker buildx use default
