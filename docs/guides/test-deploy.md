# Test 环境发版手册

本文档记录淘课网 v2 **推送到 test 服务器**的完整命令与踩坑约定。  
目标机器：Mac Studio（`10.0.14.20`，部署目录一般为 `/Users/taoke03/taokev2`）。

---

## 1. 流程概览

```
本机 ./build.sh <版本> test  → 推到 10.0.14.20:5000
         ↓
test 服务器 pull + compose up → 浏览器验证
```

| 角色 | 域名 | 容器 |
|------|------|------|
| C 端前台 | `https://v2.taoke.com` | `taokev2-frontend` |
| 管理后台 | `https://adminv2.taoke.com` | `taokev2-admin` |
| 后端 API | 经 nginx `/backend-api/` | `taokev2-backend` |
| 爬虫 | 内网 | `taokev2-crawler` |

镜像仓库：`10.0.14.20:5000/taokev2/<服务>:<版本>`  
业务服务：`backend` / `frontend` / `admin` / `crawler`（双架构 `linux/amd64,linux/arm64`）。  
ES / Kibana 一般**不随业务版本升级**。

---

## 2. 本机构建并推送镜像

### 2.1 前置检查

```bash
# Docker Desktop 需运行；buildx 必须可用
docker version
docker buildx version
```

若报 `unknown command: docker buildx`（Windows 常见）：把 Desktop 插件拷到用户目录后再开新终端：

```powershell
$userPlugins = "$env:USERPROFILE\.docker\cli-plugins"
New-Item -ItemType Directory -Force -Path $userPlugins | Out-Null
Copy-Item "C:\Program Files\Docker\Docker\resources\cli-plugins\docker-buildx.exe" `
  "$userPlugins\docker-buildx.exe" -Force
docker buildx version
```

国内网络：构建 BuildKit / 基础镜像走 `docker.m.daocloud.io`（`build.sh` 已默认）。若系统代理开着但 Docker 未配代理，可先关代理或给 Docker Desktop 配同源代理。

### 2.2 发版前建议本地过一遍前端生产构建

避免 Docker 里 `next build` 才爆 TS 错误（`dev` 模式往往不拦）：

```bash
cd admin-frontend && bun run build
cd ../frontend && pnpm build
```

### 2.3 构建推送

在仓库 `deploy/` 目录（Git Bash / macOS / Linux）：

```bash
cd deploy

# 全量（backend + frontend + admin + crawler）
./build.sh 3.0.3 test

# 只构建某一端
./build.sh 3.0.3 test backend
./build.sh 3.0.3 test frontend
./build.sh 3.0.3 test admin
./build.sh 3.0.3 test crawler
```

成功标志：日志出现 `✓ <服务> 完成` 与 `全部完成！版本 3.0.3`。  
注意：若只跑了 `./build.sh … test admin`，末尾也会写「全部完成」，**不代表四个服务都推过**——以是否出现各服务的「构建并推送」为准。

可选：只编当前机器架构加快速度（Mac M 系列）：

```bash
BUILD_PLATFORMS=linux/arm64 ./build.sh 3.0.3 test
```

黄字 `RedundantTargetPlatform` 可忽略。

---

## 3. 服务器上拉起

SSH / FinalShell 登录 test 机。

### 3.1 确认 Docker 可用

```bash
docker info >/dev/null 2>&1 && echo OK || echo 'Docker 未就绪'
docker ps
```

`docker ps` 一直卡住或报 `Cannot connect to the Docker daemon`：见 [§5.1](#51-docker-卡死--连不上守护进程)。

### 3.2 拉取并启动（推荐整套命令）

```bash
cd /Users/taoke03/taokev2   # 以实际部署目录为准
VERSION=3.0.3               # 改成目标版本

# 拉业务镜像
VERSION=$VERSION docker compose -f docker-compose.test.yml pull \
  backend frontend admin crawler

# 启动业务 + nginx（务必带上 nginx，见下节）
VERSION=$VERSION docker compose -f docker-compose.test.yml up -d \
  backend frontend admin crawler nginx

# 强烈建议：业务容器重建后强制重建 nginx，避免上游 IP 缓存指错
VERSION=$VERSION docker compose -f docker-compose.test.yml up -d --force-recreate nginx
```

使用辅助脚本（等价 stop + up，**不会**自动 force-recreate nginx）：

```bash
./start-test.sh backend frontend admin crawler nginx 3.0.3
VERSION=3.0.3 docker compose -f docker-compose.test.yml up -d --force-recreate nginx
```

### 3.3 为何必须重建 nginx

nginx 启动时会把 `frontend` / `admin` / `backend` 解析成 Docker 网络 IP 并缓存。  
只重建 frontend/admin 后 IP 可能对调，nginx 仍打旧 IP → **`v2.taoke.com` 打开管理后台登录页**。

发版后务必：

```bash
VERSION=<版本> docker compose -f docker-compose.test.yml up -d --force-recreate nginx
```

---

## 4. 验证

```bash
# 容器版本与健康
docker ps -f name=taokev2

# 后端健康
curl -sf http://127.0.0.1:8080/actuator/health
# 若映射不是 8080：docker port taokev2-backend

# 直连 API 是否有课（有数据而页面显示 0 → 多半是前端 SSR/nginx 问题）
curl -sS 'http://127.0.0.1:8080/courses?page=1&size=2&isOpen=true' | head -c 400
curl -sS 'http://127.0.0.1:8080/courses?page=1&size=2&isOpen=false' | head -c 400

# 经 nginx 确认前台是 C 端（不应出现「管理后台」/ vercel）
curl -sk --resolve v2.taoke.com:443:127.0.0.1 https://v2.taoke.com/login \
  | grep -oE '管理后台|auth-bg|data-theme="vercel"|lang="zh-CN"' | sort | uniq
# 期望：auth-bg、lang="zh-CN"
```

浏览器建议**无痕**打开：

- 前台：`https://v2.taoke.com`
- 后台：`https://adminv2.taoke.com`

---

## 5. 常见问题

### 5.1 Docker 卡死 / 连不上守护进程

现象：`docker ps` 无输出且一直挂起，或 `Cannot connect to ... docker.sock`。

远程 Mac（无菜单栏）可：

```bash
kill -9 $(pgrep -f com.docker.backend) 2>/dev/null
killall -9 "Docker Desktop" "Docker Desktop Helper" com.docker.virtualization 2>/dev/null
sleep 2
ps aux | grep -E 'com.docker.backend|Docker Desktop' | grep -v grep   # 应无输出

open -a /Applications/Docker.app

# 等待引擎就绪（Mac 无 timeout 命令）
for i in {1..24}; do
  if docker info >/dev/null 2>&1; then echo READY; break; fi
  echo "waiting $i ..."; sleep 5
done
docker ps
```

仍不行：机器 uptime 很长或内存异常时，`sudo reboot` 后重新 `open -a Docker`。

### 5.2 前台域名打开了管理后台

特征：`v2.taoke.com/login` 出现「使用手机号和密码登录管理后台」或 `data-theme="vercel"`。

```bash
# 配置一般是对的；多半是 nginx 上游 IP 过期
VERSION=<版本> docker compose -f docker-compose.test.yml up -d --force-recreate nginx frontend
```

### 5.3 专家有数据，公开课/内训显示「共 0 门」

1. 先 `curl` 后端 `/courses`（见 §4）。有 JSON 列表 → 库正常。  
2. 列表页侧栏「热门公开课/热门内训课」可能是**前端写死假数据**，不能当接口有数。  
3. C 端镜像内 `NEXT_PUBLIC_API_BASE_URL=https://v2.taoke.com/backend-api`，**SSR 也会走公网域名**；容器内 hairpin 失败时，页面 `.catch` 成空列表，直连 `http://backend:8080` 却正常。  
4. 处理：仓库 `docker-compose.test.yml` 已为 frontend 配置 `API_BASE_URL=http://backend:8080`（配合 `getApiBaseUrl` 服务端优先读该变量）。发版需：
   - 构建含该改动的 frontend 镜像；
   - 服务器 compose 同步该环境变量后 `up -d --force-recreate frontend nginx`。

验证 SSR 公网路径是否失败：

```bash
docker exec taokev2-frontend wget --no-check-certificate -qO- \
  'https://v2.taoke.com/backend-api/courses?page=1&size=2&isOpen=false' | head -c 200
# 对比内网：
docker exec taokev2-frontend wget -qO- \
  'http://backend:8080/courses?page=1&size=2&isOpen=false' | head -c 200
```

### 5.4 后端起不来：Flyway checksum 不匹配

本地与 test **共用同一 MySQL** 时，改过已执行的 `Vxx__*.sql` 会导致 `FlywayValidateException`。

约定见：[`flyway-operations.md` §4.5](./flyway-operations.md)  
处理概要：不改旧脚本、只追加新版本；冲突且 DDL 已生效则 checksum repair。

### 5.5 build.sh 推完但服务器 pull 不到某服务

检查本机构建日志是否包含该服务；漏了则单独补：

```bash
./build.sh <版本> test crawler   # 示例
```

---

## 6. 一键备忘（复制改版本号）

**本机：**

```bash
cd /path/to/taokev2-mono/deploy
docker buildx version
./build.sh 3.0.3 test
```

**服务器：**

```bash
cd /Users/taoke03/taokev2
VERSION=3.0.3
docker info >/dev/null && echo OK
VERSION=$VERSION docker compose -f docker-compose.test.yml pull backend frontend admin crawler
VERSION=$VERSION docker compose -f docker-compose.test.yml up -d backend frontend admin crawler nginx
VERSION=$VERSION docker compose -f docker-compose.test.yml up -d --force-recreate nginx
docker ps -f name=taokev2
curl -sf http://127.0.0.1:8080/actuator/health
```

---

## 7. 相关文件

| 路径 | 说明 |
|------|------|
| `deploy/build.sh` | 本机构建推送 |
| `deploy/docker-compose.test.yml` | test compose |
| `deploy/start-test.sh` | 服务器按服务 stop/up |
| `deploy/nginx/nginx.conf` / 服务器 `config/nginx.conf` | 域名反代 |
| `docs/guides/flyway-operations.md` | Flyway / 共用库约定 |
