# 项目约束速查（性能改造专用）

改造前对照；输出中「规范依据」须引用下列条款编号。

## C1 文档与栈

- 遵守 `AGENTS.md` / `CLAUDE.md`
- Java 21 + Spring Boot 3.5 + Spring Data JPA + Redisson + RabbitMQ + MySQL + Flyway
- 禁止 MyBatis、微服务拆分、JDK8 风格回退

## C2 模块边界

```
taoke-app → taoke-admin → taoke-user → taoke-common
          → taoke-course → taoke-user → taoke-common
```

- 依赖严格单向，禁止循环
- **同步跨模块**：只调目标模块 `api/` 包 Service 接口；禁止注入对方 Repository / ServiceImpl
- **异步跨模块**：`taoke-common/events/` + RabbitMQ；`EventPublisher` 发布，`@DomainEventListener` 消费
- **跨模块 Entity**：可只读 getter；禁止 setter / `new`；写操作传原始参数给 api

## C3 Admin 薄编排

- `taoke-admin`：**禁止**注入 Repository；**禁止**构造跨模块 Entity
- 复杂逻辑下沉到 user / course 的 Service

## C4 API 与安全

- 无类级 `@RequestMapping` 前缀，无 `/api` 前缀
- `@RequireRole` 与 `@RequirePermission` 不叠加误用；`SUPER_ADMIN` 跳过权限校验

## C5 JPA / MySQL

- Entity：`@DynamicInsert`，推荐 `@DynamicUpdate`；关联一律 `LAZY`
- 禁止循环中访问懒加载
- 列表三段式；详情 `JOIN FETCH` / `@EntityGraph`；列表优先 DTO 投影
- 表名复数；`id` int 自增；`created_at` / `updated_at`；索引 `idx_`；**无外键**
- 布尔列禁止 `is_` 前缀；`TINYINT(1)` + `Boolean`

## C6 Flyway

- 脚本仅在 `backend/taoke-app/src/main/resources/db/migration/`
- 新增/修改后：`uv run python data-trans/scripts/_validate_flyway_migration.py --version <N>`
- checksum 问题：按 `docs/guides/flyway-operations.md` repair，Agent 可直接执行
- 老站数据迁移进 `data-trans/`，Flyway 不做大量业务数据搬运

## C7 包管理与前端

- frontend：pnpm；admin-frontend：bun；Python：uv
- 图标 admin 仅从 `@/components/icons` 导入

## C8 命令

```bash
cd backend && mvn -pl taoke-app -am compile
uv run python data-trans/scripts/_validate_flyway_migration.py --version <N>
```
