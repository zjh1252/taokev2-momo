# taokev2-mono

淘课网本地开发 mono 仓库，包含 Java 后端、管理员后台前端、用户端前端、UniApp 端，以及独立运行的 Python 爬虫服务。

## 目录结构

| 目录 | 说明 |
| --- | --- |
| `backend/` | Spring Boot 后端，包含用户、课程、管理员、通用模块和启动模块 `taoke-app` |
| `admin-frontend/` | 管理员后台，Next.js + React + TypeScript |
| `frontend/` | 用户端前端 |
| `taoke-uniapp/` | UniApp 移动端 |
| `crawler-service/` | Python FastAPI 爬虫服务，负责抓取外部培训资源并回调 Java 后端 |
| `deploy/` | 部署相关配置 |
| `docs/` | 项目参考文档 |
| `docker-compose.local.yml` | 本地 MySQL、Redis、RabbitMQ、Elasticsearch、爬虫服务编排 |

## 爬虫功能架构

管理员后台的爬虫功能采用“Python 爬虫服务 + Java 审核入库”的结构：

1. 管理员在后台选择数据源和数据类型，创建爬取任务。
2. Java 后端记录任务，并调用 `crawler-service`。
3. Python 爬虫服务抓取外部网站数据，按批次回调 Java 后端。
4. Java 后端写入爬虫中间表，执行同源去重和跨源疑似重复标记。
5. 审核员在后台查看、编辑、驳回或确认导入。
6. 审核通过后，数据才进入正式业务表。

当前爬虫服务位于 `crawler-service/`，不再依赖 mono 仓库外部目录。

## 本地启动

### 1. 启动 Docker 中间件和爬虫服务

先打开 Docker Desktop，然后执行：

```bash
cd /Users/ricardo/Desktop/spider/spider-prj/taokev2-mono-trimmed/taokev2-mono
docker compose -f docker-compose.local.yml up -d
```

检查状态：

```bash
docker compose -f docker-compose.local.yml ps
```

爬虫服务健康检查：

```bash
curl http://localhost:8100/health
```

### 2. 启动 Java 后端

```bash
cd /Users/ricardo/Desktop/spider/spider-prj/taokev2-mono-trimmed/taokev2-mono/backend/taoke-app
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

健康检查：

```bash
curl http://localhost:8080/actuator/health
```

### 3. 启动管理员后台

```bash
cd /Users/ricardo/Desktop/spider/spider-prj/taokev2-mono-trimmed/taokev2-mono/admin-frontend
bun install
bun dev
```

访问：

```text
http://localhost:3000
```

## 本地关闭

前端和 Java 后端如果是在终端启动的，在对应终端按 `Control + C`。

关闭 Docker 中间件和爬虫服务：

```bash
cd /Users/ricardo/Desktop/spider/spider-prj/taokev2-mono-trimmed/taokev2-mono
docker compose -f docker-compose.local.yml down
```

注意：不要随便执行 `docker compose down -v`，它会删除本地数据库和 Elasticsearch 等 volume 数据。

## 常用地址

| 服务 | 地址 |
| --- | --- |
| 管理员后台 | http://localhost:3000 |
| Java 后端 | http://localhost:8080 |
| Java 健康检查 | http://localhost:8080/actuator/health |
| Python 爬虫服务 | http://localhost:8100 |
| Python 健康检查 | http://localhost:8100/health |
| RabbitMQ 管理后台 | http://localhost:15672 |
| Elasticsearch | http://localhost:9200 |

RabbitMQ 本地账号：`guest / guest`。

## 开发注意事项

- 新增爬虫时优先放在 `crawler-service/crawlers/`，并在 `crawler-service/services/job_manager.py` 注册。
- 管理员后台爬虫页面位于 `admin-frontend/src/features/crawl/` 和 `admin-frontend/src/app/dashboard/crawl/`。
- Java 爬虫管理逻辑位于 `backend/taoke-admin/src/main/java/com/taoke/admin/`。
- 数据库结构通过 Flyway 迁移维护，爬虫中间表迁移在 `backend/taoke-app/src/main/resources/db/migration/`。
- 爬取数据不要绕过审核流程直接写正式业务表。

