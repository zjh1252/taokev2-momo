---
name: api-rt-optimize
description: >-
  淘课网 v2 接口响应速度全链路优化。扫描并改造 JPA N+1、慢SQL/索引、Redis、跨模块串行调用、
  MQ异步剥离、admin薄编排违规、三端配套优化。当用户提到接口慢、RT过长、性能优化、
  N+1、慢SQL、TPS、压测、缓存击穿、响应速度优化时使用。
---

# 淘课网 v2 接口响应速度优化

## 何时使用

用户提出以下诉求时**必须**按本 Skill 执行：
- 接口/列表/详情响应慢、RT 过长、TPS 不足
- N+1、慢 SQL、缺索引、缓存穿透/击穿、串行调用
- 压测优化、全链路性能诊断

## 强制前置输入

向用户索取（缺一不可则先诊断可观测部分，标注缺口）：

| 输入 | 说明 |
|------|------|
| 接口代码 / 路径 | Controller + Service 方法名或 `METHOD /path` |
| 链路耗时 | 网关/应用/DB/Redis/远程分段 RT，或 APM 火焰图摘要 |
| 慢 SQL | `EXPLAIN`/`slow_query_log` 原文，含执行计划 |
| 实体 | 相关 Entity / 关联字段 / 表名 |
| 并发场景 | QPS、峰值、缓存命中预期、是否写多读多 |

无用户材料时：先在仓库内按「扫描清单」自动定位反模式，输出假设性瓶颈，再请用户补慢 SQL / 压测数据。

## 基础规则（不可违反）

1. 先读并遵守仓库根目录 `AGENTS.md`、`CLAUDE.md`；冲突时以两者共同约束为准，**禁止**违规改造。
2. 技术栈：Java 21 + Spring Boot 3.5 + Spring Data JPA + Redisson + RabbitMQ + MySQL + Flyway；前端 Next.js / UniApp。**禁用** MyBatis、微服务拆分、JDK8 改写旧方案。
3. `taoke-admin` 为薄编排层：**禁止**注入 Repository；数据操作统一调用 `taoke-user` / `taoke-course` 的 `api/` 接口；**禁止**跨模块直接读写 Entity（只读 getter 除外，禁止 setter/new）。
4. 模块单向依赖：`app → admin → user → common`，`app → course → user → common`。
5. 无依赖串行调用改用 `CompletableFuture` 并行；非核心耗时逻辑走 RabbitMQ 领域事件（`EventPublisher` + `@DomainEventListener`）。
6. 拒绝空泛理论；每条优化必须含：**问题代码 → 根因 → 规范依据（标注 AGENTS/CLAUDE 条款）→ 改造代码 → 耗时收益 → 业务兼容风险**。
7. 优先复用 `taoke-common` 已有工具；新增索引必须出标准 Flyway 脚本并跑校验命令。
8. 注释中文；JavaDoc `@author Fangxinxin` + `@date`；禁止 `@Deprecated` 兼容旧版。

规范速查见 [project-constraints.md](project-constraints.md)。全量校验条目见 [checklist.md](checklist.md)。

## 执行工作流

复制并跟踪进度：

```
RT 优化进度:
- [ ] 0. 收集输入 / 扫描反模式
- [ ] 1. 瓶颈诊断（链路分段）
- [ ] 2. 架构合规修复（admin DAO/跨模块 Entity）
- [ ] 3. P0 方案落地（JPA/MySQL/热点缓存/串行）
- [ ] 4. P1 方案落地（Pipeline/异步/事务/批量）
- [ ] 5. P2 方案落地（代码/JVM/连接池/前端）
- [ ] 6. Flyway 索引脚本 + 校验命令
- [ ] 7. 按输出模板交付（含量化预期与兼容风险）
```

### Step 0 — 扫描反模式（可并行）

在 `backend/` 内搜索并汇总：

| 模式 | 搜索建议 |
|------|----------|
| EAGER / 循环懒加载 N+1 | `FetchType.EAGER`、`getXxx()` 于 for 循环、未用 `@EntityGraph`/`JOIN FETCH` |
| 列表非三段式 | `Page<Entity>` 直接返回、循环内 `repository.find*` |
| 无投影全量 Entity | Controller 直接返回 Entity、`select *` 式 JPQL |
| 缺 `@DynamicInsert` | 新建 Entity 未加注解 |
| admin 违规 | `taoke-admin` 注入 `*Repository`、构造跨模块 Entity |
| 串行跨模块 | 同方法内多个独立 `*Api`/`*Service` 顺序 await |
| 循环 Redis | 循环内 `redis.get/set`、未 Pipeline/批量 |
| 同步非核心 | Controller/主事务内发短信/统计/AI 匹配/对账 |

### Step 1 — 瓶颈诊断

输出分段：应用编排 / JPA / MySQL / Redis / 跨模块 / MQ / 前端。每项标明证据（代码路径或 SQL）。

### Step 2 — 分级方案

| 优先级 | 改什么 |
|--------|--------|
| **P0** | N+1、无索引慢 SQL、热点无缓存、串行同步调用、**架构合规违规** |
| **P1** | 循环 Redis 单操作、主流程同步耗时逻辑、事务过大、循环调 API |
| **P2** | MapStruct/日志/集合低效、JVM/连接池/Tomcat、三端配套 |
| **P3** | 容器微调、MQ 批量消费、缓存预热 |

一次会话优先落地 **P0 + 合规**；P1+ 需用户确认范围。

### Step 3 — 改造约束（实现时）

**JPA 列表三段式（强制）**

```text
1) 分页只查主键 ID（可加必要过滤列）
2) WHERE id IN (...) 批量查主表（保持顺序）
3) 批量查关联 / 集合，内存组装 DTO（禁止循环内查库）
```

详情：`JOIN FETCH` 或 `@EntityGraph`；列表优先 Interface Projection / JPQL `new DTO`。

**跨模块并行**

```java
CompletableFuture<A> fa = CompletableFuture.supplyAsync(() -> aApi.get(...), bizExecutor);
CompletableFuture<B> fb = CompletableFuture.supplyAsync(() -> bApi.get(...), bizExecutor);
CompletableFuture.allOf(fa, fb).join(); // 注意：禁止在持有 DB 事务时阻塞远程调用
```

使用自定义业务线程池，禁止默认 `ForkJoinPool.commonPool()` 跑阻塞 IO。事务范围外并行；有 DB 写则缩小 `@Transactional`。

**缓存**

- 热点：课程/专家/CMS/权限；键名带业务版本；分页缓存只缓存 ID 页 + 短 TTL，避免超大 value。
- 穿透：空值短 TTL；击穿：单 key 互斥（锁粒度最小化）；雪崩：TTL 抖动。
- 循环读写 → Redisson/Lettuce Pipeline 或批量 API。

**索引 Flyway**

路径：`backend/taoke-app/src/main/resources/db/migration/V{N}__add_idx_*.sql`  
命名：`idx_` 前缀；**不使用外键**；脚本幂等优先。  
新版本号取 migration 目录当前最大 `V{N}` + 1（勿改已执行脚本）。

交付前执行：

```bash
uv run python data-trans/scripts/_validate_flyway_migration.py --version <N>
```

checksum 不匹配时按 `docs/guides/flyway-operations.md` 编写/复用 `_fix_flyway_*.py` 并**直接执行 repair**。

**校验命令（写进交付）**

```bash
# 后端编译（在 backend/，按 AGENTS.md）
cd backend && mvn -pl taoke-app -am compile

# Flyway 脚本自检
uv run python data-trans/scripts/_validate_flyway_migration.py --version <N>
```

若当前会话规则禁止 Maven：仍写出命令供开发者本地执行，并在交付中标注「需人工编译验证」。

### Step 4 — 固定输出结构

必须按 [output-template.md](output-template.md) 输出：

1. 瓶颈诊断  
2. P0 / P1 / P2 分级方案（含问题代码、根因、规范依据、改造代码、耗时收益、兼容风险）  
3. 代码 / 索引 / 配置（可复制）  
4. 校验命令  
5. 压测预期（RT 降幅、DB 查询减少比例、TPS 提升估）  

量化指标无实测时标注 **「预估，需压测复核」**，禁止伪造精确毫秒。

## 三端配套（改后端时同步建议，非默认改 UI）

- C 端 Next.js：React Query 预加载、列表懒加载、合并重复请求（`frontend/`，pnpm）
- Admin：虚拟滚动、字典本地缓存、请求合并（`admin-frontend/`，bun）
- UniApp：静态数据本地缓存、聚合零散小接口

仅当用户明确要求改前端时再动对应工程。

## 完成后

用户确认任务完成后，将工作摘要追加到 `/docs/process/works.md`。
