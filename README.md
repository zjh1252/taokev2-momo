# 淘课网 v2

企业培训采购平台 Monorepo：连接培训需求方（企业/个人）与供给方（专家/机构），覆盖资源展示、需求对接、交易转化与运营管理。

技术栈概览：

| 层级 | 技术 |
|------|------|
| 后端 | Java 21 · Spring Boot 3.5 · JPA · Redis · RabbitMQ · Flyway |
| C 端 Web | Next.js 16 · pnpm · Tailwind · next-intl |
| 管理后台 | Next.js 16 · bun · React Query · TanStack Form |
| 移动端 | UniApp（Vue） |
| 部署 | Docker Compose · Nginx · Nacos · Elasticsearch |

---

## 仓库目录

```
taokev2-mono/
├── backend/            # 后端模块化单体
├── frontend/           # C 端 Web
├── admin-frontend/     # 运营管理后台
├── taoke-uniapp/       # 移动端（UniApp）
├── deploy/             # 部署与中间件配置
├── crawler-service/    # 爬虫 / 数据采集服务（Python）
├── data-trans/         # 老站数据迁移脚本
├── docs/               # 项目文档
├── openspec/           # OpenSpec 变更提案与规格
├── scripts/            # 根级辅助脚本
├── tkw/                # 历史/参考资料（老站相关）
├── output/             # 脚本输出产物（一般不入库）
└── tmp/ / logs/        # 本地临时与日志目录
```

### 应用与服务

| 目录 | 说明 |
|------|------|
| [`backend/`](./backend) | Java 模块化单体，业务 API 与后台编排入口 |
| [`frontend/`](./frontend) | C 端官网 / 用户侧 Web（Next.js，包管理器用 **pnpm**） |
| [`admin-frontend/`](./admin-frontend) | 运营管理后台（Next.js，包管理器用 **bun**） |
| [`taoke-uniapp/`](./taoke-uniapp) | 移动端 UniApp 工程（页面、组件、stores、api） |
| [`deploy/`](./deploy) | Docker Compose、Nginx、Nacos、ES 及各应用部署配置 |
| [`crawler-service/`](./crawler-service) | Python 爬虫服务（FastAPI / uvicorn），依赖用 **uv** 管理 |

### 数据与迁移

| 目录 | 说明 |
|------|------|
| [`data-trans/`](./data-trans) | 老站 → 新站数据迁移脚本、校验与修复工具；**Flyway 只做 schema/种子，不做大批量业务迁移** |
| [`backend/taoke-app/src/main/resources/db/migration/`](./backend/taoke-app/src/main/resources/db/migration) | Flyway SQL 迁移脚本 |

### 文档与协作

| 目录 | 说明 |
|------|------|
| [`docs/`](./docs) | 项目文档：架构说明、角色体系、操作指南、过程记录等 |
| [`docs/guides/`](./docs/guides) | 运维与开发指南（如 Flyway、数据迁移） |
| [`docs/process/`](./docs/process) | 过程记录（如 `works.md`） |
| [`openspec/`](./openspec) | OpenSpec 变更提案 / 规格工作流产物 |
| [`scripts/`](./scripts) | 仓库根级辅助脚本 |

### 本地 / 工具目录（一般可忽略）

| 目录 | 说明 |
|------|------|
| `.claude/` · `.codex/` · `.cursor/` · `.superpowers/` | AI Agent / IDE 相关配置与技能 |
| `.idea/` · `.vscode/` | IDE 本地配置 |
| `output/` · `tmp/` · `logs/` · `.venv/` | 运行产物、临时文件、本地 Python 虚拟环境 |

---

## 后端模块（`backend/`）

模块依赖单向、禁止循环：

```
taoke-app → taoke-admin → taoke-user → taoke-common
                        → taoke-course → taoke-user → taoke-common
```

| 模块 | 职责 |
|------|------|
| `taoke-common` | 公共基础：工具、DTO、事件总线、安全注解、文件上传等 |
| `taoke-user` | 用户域：认证、权限、RBAC、各角色档案、供给侧绑定 |
| `taoke-course` | 课程域：课程、订单、支付、需求、案例、评价、CMS、消息 |
| `taoke-admin` | 管理后台薄编排层（调用 user/course 的 `api/`，不直接访问 Repository） |
| `taoke-app` | 启动入口（`TaokeApplication`，`scanBasePackages="com.taoke"`） |
| `taoke-legacy` | 遗留兼容相关代码（按需使用） |

跨模块约定简述：同步调用走目标模块 `api/` 接口；异步用领域事件 + RabbitMQ；跨模块 Entity 只读不写。

---

## 常用命令

### 后端（在 `backend/` 下）

```bash
cd backend
mvn -pl taoke-app -am compile   # 编译自检
mvn -pl taoke-app -am test      # 测试
```

### C 端 Frontend（仅 pnpm）

```bash
cd frontend
pnpm install
pnpm dev
pnpm build
pnpm lint
```

### 管理后台（仅 bun）

```bash
cd admin-frontend
bun install
bun dev
bun run build
bun lint
```

### Python（仅 uv）

```bash
uv sync --all-packages
uv run python data-trans/scripts/_validate_flyway_migration.py --version <N>
uv run --directory crawler-service uvicorn main:app --host 0.0.0.0 --port 8100
```

包管理器锁定：**frontend → pnpm**，**admin-frontend → bun**，**Python → uv**，勿混用。

---

## 更多文档

- 仓库级 Agent 指引：[`CLAUDE.md`](./CLAUDE.md) / [`AGENTS.md`](./AGENTS.md)
- 项目概述与架构：[`docs/`](./docs)
- 数据迁移：[`docs/guides/data-trans-migration.md`](./docs/guides/data-trans-migration.md)
- Flyway 操作：[`docs/guides/flyway-operations.md`](./docs/guides/flyway-operations.md)
