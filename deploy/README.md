# 淘课网 v2 — 部署指南

## 目录结构

```
deploy/
├── build.sh                     # 一键构建 & 推送镜像脚本
├── docker-compose.test.yml      # Test 环境编排文件
├── application-test.yaml        # 后端 Test 环境配置（需手动放置）
├── backend/
│   └── Dockerfile               # 后端镜像（Java 21 多阶段构建）
├── frontend/
│   └── Dockerfile               # C 端前端镜像（Node 22 + Next.js standalone）
└── admin-frontend/
    └── Dockerfile               # 管理后台前端镜像（Node 22 + Next.js standalone）
```

## 镜像仓库

- 地址：`10.0.16.26:5000`
- 镜像前缀：`taokev2`
- 生成的镜像名：
  - `10.0.16.26:5000/taokev2-backend:<version>`
  - `10.0.16.26:5000/taokev2-frontend:<version>`
  - `10.0.16.26:5000/taokev2-admin:<version>`

Docker 守护进程需配置 insecure-registries：

```json
{
  "insecure-registries": ["10.0.16.26:5000"]
}
```

---

## 一、构建镜像

### build.sh 用法

```bash
./deploy/build.sh <版本号> [环境] [目标]
```

| 命令 | 说明 |
|------|------|
| `./deploy/build.sh 1.0.1` | 构建全部 3 个镜像，默认环境 |
| `./deploy/build.sh 1.0.1 test` | 构建全部 3 个镜像，使用 test 环境配置 |
| `./deploy/build.sh 1.0.1 test backend` | 仅构建后端，test 环境 |
| `./deploy/build.sh 1.0.1 test frontend` | 仅构建 C 端前端，test 环境 |
| `./deploy/build.sh 1.0.1 test admin` | 仅构建管理后台前端，test 环境 |
| `./deploy/build.sh 1.0.1 backend` | 仅构建后端，默认环境 |

### 环境参数说明

- 指定环境（如 `test`）后，前端 Dockerfile 会在构建时将对应项目下的 `.env.test` 复制为 `.env.local`，使 `NEXT_PUBLIC_*` 等变量被正确 bake 进 Next.js 产物。
- 后端镜像不区分环境，配置通过运行时挂载 `application-test.yaml` + Spring Profile 切换。

### 相关环境配置文件

| 服务 | 文件位置 | 用途 |
|------|----------|------|
| 后端 | `backend/taoke-app/src/main/resources/application-test.yaml` | Spring Boot test 环境配置 |
| C 端前端 | `frontend/.env.test` | Next.js 构建时变量（`NEXT_PUBLIC_API_BASE_URL` 等） |
| 管理后台 | `admin-frontend/.env.test` | Next.js 构建时变量（`BACKEND_URL` 等） |

---

## 二、部署 Test 环境

### 前置条件

1. 镜像已通过 `./deploy/build.sh <version> test` 构建并推送到仓库
2. 在 test 服务器上准备好 `application-test.yaml`，放到 compose 文件同级目录（`/Users/taoke03/taokev2/`）

### 启动服务

```bash
cd deploy

# 指定版本启动
VERSION=1.0.1 docker compose -f docker-compose.test.yml up -d

# 使用 latest 标签启动
docker compose -f docker-compose.test.yml up -d
```

### 停止服务

```bash
docker compose -f docker-compose.test.yml down
```

### 查看日志

```bash
# 全部日志
docker compose -f docker-compose.test.yml logs -f

# 单个服务
docker compose -f docker-compose.test.yml logs -f backend
docker compose -f docker-compose.test.yml logs -f frontend
docker compose -f docker-compose.test.yml logs -f admin
```

### 更新版本

```bash
# 1. 在开发机构建并推送新版本
./deploy/build.sh 1.0.2 test

# 2. 在 test 服务器拉取并重启
cd deploy
VERSION=1.0.2 docker compose -f docker-compose.test.yml up -d
```

### 容器与端口

| 服务 | 容器名 | 端口 | 访问方式 |
|------|--------|------|----------|
| 后端 API | taokev2-backend | 8080 | `http://<server-ip>:8080` |
| C 端前端 | taokev2-frontend | 3000 | `http://v2.taoke.com`（域名解析到服务器） |
| 管理后台 | taokev2-admin | 3001 | `http://<server-ip>:3001` |

### 数据持久化

- 后端配置文件：`./application-test.yaml` -> 容器内 `/app/config/application-test.yaml`（只读）
- 后端上传文件存储：`./web/storage` -> 容器内 `/app/storage`
- 后端日志：`./web/logs` -> 容器内 `/app/logs`

Test 环境宿主机目录结构（`/Users/taoke03/taokev2/`）：

```
/Users/taoke03/taokev2/
├── docker-compose.test.yml       # compose 编排文件
├── application-test.yaml         # 后端配置
└── web/
    ├── storage/                  # 后端上传文件持久化
    └── logs/                     # 后端日志持久化
```
