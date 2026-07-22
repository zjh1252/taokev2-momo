# Flyway 操作手册

本文档记录淘课网 v2 后端 **Flyway 数据库迁移** 的配置、规范、常见操作与历史事件，便于排查启动失败、迁移冲突等问题。

---

## 1. 基本信息

| 项 | 说明 |
|---|---|
| 迁移工具 | [Flyway](https://flywaydb.org/)（Spring Boot 自动集成） |
| 依赖模块 | `backend/taoke-app`（`flyway-core` + `flyway-mysql`） |
| 脚本目录 | `backend/taoke-app/src/main/resources/db/migration/` |
| 历史表 | `flyway_schema_history`（位于当前连接的数据库，如 `v3test`） |
| 应用配置 | `backend/taoke-app/src/main/resources/application.yml` → `spring.flyway.*` |
| ORM 策略 | `spring.jpa.hibernate.ddl-auto: validate`（**表结构以 Flyway 为准**，禁止依赖 Hibernate 自动建表） |

### 1.1 当前 Flyway 配置

```yaml
spring:
  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration
    encoding: UTF-8
```

- **enabled: true**：应用启动时自动执行未运行的迁移。
- **baseline-on-migrate: true**：对已存在表但无 Flyway 历史的库，首次迁移时写入 baseline，避免重复建表。
- **encoding: UTF-8**：迁移脚本必须为 UTF-8，避免中文注释/种子数据乱码。

### 1.2 与 JPA 的关系

- 启动顺序：Flyway 迁移 → Hibernate `validate` 校验 Entity 与表结构一致。
- **禁止**在业务代码外直接改表结构而不写 Flyway 脚本；否则下次启动可能 `validate` 失败。

---

## 2. 脚本命名规范

```
V{版本号}__{英文描述}.sql
```

示例：

- `V16__create_courses_and_plans_tables.sql`
- `V1_1__init_permissions.sql`（允许子版本号）
- `V66__purge_obvious_test_courses.sql`

规则：

1. 版本号**全局递增**，不可重复；当前仓库脚本约 **V1 ~ V75**（含 `V1_1`、`V1_2` 等）。
2. 双下划线 `__` 分隔版本与描述；描述用 snake_case 英文。
3. 每个脚本应**可重复执行或幂等**（推荐：`IF NOT EXISTS`、列存在性检查、临时表 + 条件 DELETE）。
4. 注释语言：**中文**（与项目规范一致）。
5. 新脚本只追加，**不要修改已上线/已执行的旧脚本**（checksum 变更会导致校验失败）。
6. **Agent 交付前**必须按 [§4.4 Agent 交付自检清单](#44-agent-交付自检清单防后端启动失败) 执行，避免后端无法启动。

---

## 3. 迁移如何生效

### 3.1 常规方式（推荐）

由开发者**手动编译并启动** `taoke-app`（IDE 运行 `TaokeApplication` 或本地 Maven 启动）。  
启动时 Spring Boot 自动调用 Flyway，按版本顺序执行 `db/migration` 下未成功的脚本。

> AI 助手侧约定：**禁止**在自动化流程中执行 `mvn` 编译；Flyway 迁移随人工启动后端触发。

### 3.2 执行结果写入

每条迁移在 `flyway_schema_history` 中记录一行：

| 字段 | 含义 |
|---|---|
| `installed_rank` | 执行顺序 |
| `version` | 版本号（如 `66`） |
| `description` | 描述（来自文件名） |
| `script` | 文件名 |
| `checksum` | 脚本内容校验和 |
| `success` | `1` 成功 / `0` **失败** |

### 3.3 常用检查 SQL

```sql
-- 查看最近迁移记录
SELECT installed_rank, version, description, success, installed_on, script
FROM flyway_schema_history
ORDER BY installed_rank DESC
LIMIT 20;

-- 查看失败迁移
SELECT * FROM flyway_schema_history WHERE success = 0;

-- 查看当前最高成功版本
SELECT MAX(CAST(version AS UNSIGNED)) FROM flyway_schema_history WHERE success = 1;
```

---

## 4. 标准操作流程

### 4.1 新增表/字段/索引

1. 在 `db/migration/` 新建下一版本脚本，如 `V67__add_xxx.sql`。
2. 编写 DDL/DML，尽量幂等。
3. 本地/测试库启动 `taoke-app`，确认日志出现 `Successfully applied migration ...`。
4. 确认 `flyway_schema_history` 中 `success = 1`。
5. 提交脚本到 Git（与 Java 代码同 PR）。

### 4.2 种子数据（Seed）与老站回填

- 早期示例：`V10__seed_trainer_data.sql`、`V13__seed_course_categories.sql`、`V18__seed_courses_and_plans.sql`。
- 大量**老站迁移数据**走 `data-trans/` Python/SQL 管道，**不经过 Flyway**；Flyway 负责新系统基线 + 增量演进。
- **混合模式**（V68 起）：Flyway 脚本只做可重复的标量 UPDATE；依赖老库 `taoke` 的关联表 INSERT 在同库用 Python 补跑（见 §7 changelog V68）。

### 4.3 数据清理类迁移

- 示例：`V66__purge_obvious_test_courses.sql`（删除明显测试公开课/内训课）。
- 注意：若同时存在 **Python 手工脚本** 与 **Flyway 脚本** 做同一件事，必须先统一 SQL 逻辑，避免「手工已执行 + Flyway 再次执行」或「Flyway 失败导致后端无法启动」。

### 4.4 Agent 交付自检清单（防后端启动失败）

**每次新增或修改** `db/migration/V*.sql` 后，Agent 在交付前必须完成以下检查（禁止仅「写完脚本」即结束）：

| 检查项 | 说明 |
|--------|------|
| 版本号唯一 | 目录内无重复 `V{n}__`；新号大于当前库 `MAX(version)` |
| 不改已执行脚本 | 已 `success=1` 的文件禁止改内容；应追加更高版本 |
| 跨库 `taoke.*` | 引用老库时必须 `information_schema.SCHEMATA` / `TABLES` 防御，无 `taoke` 时跳过（纯新库/CI 可启动） |
| 禁用 `DELIMITER` | 存储过程式脚本 Flyway 拆分易失败；用 `PREPARE` + `information_schema` 或改放 `data-trans/` |
| 列/表存在 | DDL 用 `IF NOT EXISTS` / `information_schema.COLUMNS`（参考 V128） |
| 幂等 DML | 大批量 UPDATE/DELETE 可重复执行或影响面可预期 |
| 自动化验证 | 运行 `uv run python data-trans/scripts/_validate_flyway_migration.py --version <N>`（需先 `uv sync`） |
| 历史冲突 | 库内 `flyway_schema_history` 同版本 `script` 名与仓库一致；孤儿版本用 `_fix_flyway_*.py` 清理，**勿删已入库脚本对应记录** |

**典型启动失败信号**（日志 / 现象）：

- `FlywayValidateException`：checksum 不匹配、失败迁移未 repair
- `SQLException: Unknown database 'taoke'`：跨库脚本无防御
- `success=0` 残留在 `flyway_schema_history`：后续启动被阻断
- 8080 未监听 → 前端「网络连接失败」

**Agent 约定**：验证脚本返回非 0 时，先修 SQL 再交付；checksum 问题按 §5.2 直接跑 `_fix_flyway_*.py` repair。

### 4.5 本地开发与 test 共用同一数据库时的约定

> 当前实践：本地开发与 test 环境可能连接**同一 MySQL 库**（换库成本高时允许）。此时 Flyway 历史表是公共账本，必须按下列规则操作，否则会出现 checksum 冲突、test 后端起不来、页面 502。

**原则**：谁先跑迁移，库内 `flyway_schema_history` 就以那次脚本内容为准；之后本地与 test **必须使用同一 git 内容的迁移文件**。不要关 Flyway 规避问题。

| 规则 | 说明 |
|------|------|
| 只追加、不改旧脚本 | 某版本一旦在该库 `success=1`，禁止再改对应 `Vxx__*.sql`；表结构变更一律新建更高版本 |
| 先提交再跑 / 再打镜像 | 避免：本地用未提交 SQL 写入库，再构建出「已改过脚本」的镜像上 test |
| 发 test 前对齐 | 镜像内迁移文件须与库中已执行内容一致；若已改过已执行脚本，要么回滚文件内容再构建，要么确认 DDL 已按新脚本生效后做 checksum repair（§5.2） |
| 发版窗口内少改库 | 本地猛改 Flyway 时先别发 test；发版窗口内本地也勿再改旧脚本 |
| 业务镜像版本对齐 | `compose up` 时显式 `VERSION=x.y.z`，backend / frontend / admin / crawler 同版本；勿漏带 VERSION 导致部分服务停在旧标签 |
| 禁止用关 Flyway 代替治理 | `ddl-auto: validate` 依赖 Flyway 演进表结构；关校验只会掩盖不一致 |

**典型事故链（2026-07-22）**：本地改过已执行的 V87 → 库内 checksum 与 test 镜像不一致 → backend `FlywayValidateException` → nginx 502。处理：按 §5.2 repair，或对齐脚本后重启；长期靠本表约束，而非拆库/关 Flyway。

---

## 5. 故障排查与修复

### 5.1 典型报错：后端启动失败，Flyway validate 失败

```
FlywayValidateException: Detected failed migration to version 66 ...
Please remove any half-completed changes then run repair ...
```

**原因**：某版本脚本执行中途失败，`flyway_schema_history.success = 0`，后续启动被阻断。

**处理步骤**：

1. 查失败记录：
   ```sql
   SELECT * FROM flyway_schema_history WHERE success = 0;
   ```
2. 查应用启动日志，定位 SQL 报错（如表名错误、语法错误）。
3. **修正** `Vxx__xxx.sql` 脚本内容（若尚未在其他环境成功执行）。
4. 删除失败历史行（等价于 Flyway repair 的一种手工方式）：
   ```sql
   DELETE FROM flyway_schema_history WHERE version = '66' AND success = 0;
   ```
5. 重新启动 `taoke-app`；Flyway 会**重新执行**该版本脚本。
6. 确认 `success = 1` 且业务 API 正常。

项目内辅助脚本（2026-05-23 新增）：

- `data-trans/scripts/_fix_flyway_v66.py` — 删除 V66 失败记录的示例。

### 5.2 典型报错：Checksum 不匹配

修改了**已经执行过**的迁移文件内容，会导致校验失败，启动日志类似：

```
FlywayValidateException: Validate failed: Migrations have failed validation
Migration checksum mismatch for migration version 68
-> Applied to database : 1298074380
-> Resolved locally    : -100945177
Either revert the changes to the migration, or run repair to update the schema history.
```

**处理**：

| 方案 | 适用场景 | 操作 |
|---|---|---|
| **推荐** | 脚本尚未在其他环境执行 | 撤销对旧文件的修改，新建更高版本脚本做 ALTER/UPDATE |
| **Repair（手工）** | 脚本已在当前库成功执行，仅本地文件被小改（如注释、长度常量）且 DML 已生效 | 将 `flyway_schema_history.checksum` 更新为日志中的 **Resolved locally** 值，再重启后端 |
| **Flyway repair 命令** | 有 Flyway CLI 且团队统一使用 | `flyway repair`（本项目通常用手工 SQL / Python 脚本等价操作） |

**Repair 步骤（v3test 示例）**：

1. 从启动日志读取 `Resolved locally` 的 checksum（整数，可为负数）。
2. 执行（将 `68`、checksum 替换为实际值）：
   ```sql
   UPDATE flyway_schema_history SET checksum = -100945177 WHERE version = '68';
   ```
3. 确认 `success = 1` 后重启 `taoke-app`。
4. **禁止**在未确认 DML 已成功执行的情况下 repair——否则 Flyway 认为已迁移，实际数据可能未更新。

项目内辅助脚本：

| 脚本 | 用途 |
|---|---|
| `data-trans/scripts/_fix_flyway_v67_checksum.py` | V67 checksum → `-524896563` |
| `data-trans/scripts/_fix_flyway_v68_checksum.py` | V68 checksum → `-100945177` |
| `data-trans/scripts/_fix_flyway_v111_v112_checksum.py` | V111 → `58602019`、V112 → `138274204` |
| `data-trans/scripts/_fix_flyway_v66.py` | 删除 V66 **失败**记录（`success=0`），非 checksum |

> **Agent 约定**：出现 checksum 不匹配且已有/可编写 `_fix_flyway_*.py` 时，**直接执行脚本 repair**，无需额外向用户确认；执行后提示重启 `taoke-app`。

> **教训**：迁移脚本一旦在某环境 Flyway 执行成功，**不要再改该文件**；应追加 V69 等新版本。DevTools 热重启会重新跑 Flyway validate，checksum 不一致会导致 8080 起不来，前端表现为「网络连接失败」。

### 5.3 手工 SQL 与 Flyway 重复执行

| 场景 | 风险 | 建议 |
|---|---|---|
| 先用 Python/Navicat 执行清理，再添加同逻辑 Flyway | Flyway 再次执行通常无影响（幂等），但失败记录会阻断启动 | 脚本写成幂等；手工执行后仍需保证 Flyway 版本能成功跑完 |
| Flyway 失败后再用手工脚本补跑 | 历史表仍为 `success=0`，**后端仍无法启动** | 修脚本 + 清失败记录 + 重启 |
| 只手工改库、不写 Flyway | 其他环境/同事启动不一致 | **禁止**；必须补 Flyway 脚本 |

### 5.4 前端「网络连接失败」与 Flyway 的关系

C 端 `apiClient` 在无法连接后端（`localhost:8080`）时会 toast：

> 网络连接失败，请检查网络后重试

若删数据后前端报错，**优先检查后端是否在监听 8080**，而非前端代码。Flyway 失败会导致 **整个 Spring Boot 起不来**，从而触发该提示。

---

## 6. 与 data-trans 迁移的边界

> **硬性规则：老站数据迁移脚本全部放在 `data-trans/` 下**（`scripts/`、`output/`、`docs/`），不得散落在 `backend/` 或其它目录。完整规范见 [data-trans-migration.md](./data-trans-migration.md)。

| 方式 | 目录/入口 | 用途 |
|---|---|---|
| **Flyway** | `backend/taoke-app/.../db/migration/` | 新系统 schema 演进、种子基线、可重复的环境增量 |
| **data-trans** | `data-trans/scripts/`、`data-trans/output/*.sql` | 老站 `taoke` → 新库 `v3test` 批量迁移、审计、补数 |

注意：

- `data-trans` 文档中「地区表保留 Flyway 数据」指：`common_regions` 等已由 **V6/V9** 等 Flyway 脚本写入，老站迁移脚本**跳过**覆盖。
- 业务排查文档见 `data-trans/docs/guides/数据迁移操作手册.md`；**Flyway 运维**以本文档为准。
- Flyway 与 data-trans 逻辑重叠时（如 V66 与 `_purge_obvious_test_courses.py`），**两边同步维护**。

---

## 7. 操作记录（changelog）

> 后续凡涉及 Flyway 脚本的增删改、生产/测试库 repair、与手工 SQL 的联动，在此追加一条。

### 2026-07-22 — 本地与 test 共用库约定（§4.5）

**背景**：test 与本地连同一库；本地改过已执行的 V87 后，test 后端 Flyway validate 失败（checksum 不匹配）导致 502。同时 compose 未对齐 VERSION 时出现 frontend/admin/backend 与 crawler 镜像版本不一致。

**约定**：写入本文 §4.5；不换库时以「不改旧脚本 + 先提交再跑 + 发版写死同一 VERSION + 冲突按 §5.2 repair」约束，不关 Flyway。

### 2026-07-17 — V150 纠正专家评价 scope 并回填评分

- **问题**：迁库评价多为 `COURSE` + `course_id IS NULL` + `trainer_user_id`；V149 只按 `TRAINER` 回填，导致几乎全部专家 `score=0`。
- **修复**：V150 将上述记录归并为 `TRAINER`，再按已通过评价重算 `user_trainers.score` / `comment_count`。
- **校验**：`uv run python data-trans/scripts/_validate_flyway_migration.py --version 150`。

### 2026-07-17 — V149 回填专家/机构综合评分

- **问题**：评价审核只同步 `comment_count`，未重算 `score`，列表出现「有 N 条评价但评分 0.0」。
- **修复**：`ReviewServiceImpl` 审核通过/驳回/隐藏后按已通过评价 `AVG(avg_score)` 全量回写；Flyway V149 对存量 `user_trainers` / `user_institutions` 做同口径回填（并同步 `comment_count`）。
- **校验**：`uv run python data-trans/scripts/_validate_flyway_migration.py --version 149`。
- **后续**：V149 回填口径过窄，由 V150 纠正。

### 2026-06-23 — V111/V112 checksum repair

**背景**：V111（公开课到期隐藏）、V112（`is_expire_hide` 列类型修正）在 `v3test` 已成功执行后，本地迁移文件再次编辑，Flyway validate 报 checksum 不匹配，后端无法启动。

**操作**：

1. 新增 `data-trans/scripts/_fix_flyway_v111_v112_checksum.py`。
2. 在 `v3test` 执行 repair：V111 `2145619465` → `58602019`，V112 `245971258` → `138274204`（均为 `success=1`）。
3. 重启 `taoke-app` 验证 Flyway 通过。

### 2026-05-23 — V66 清理测试课程 + 启动失败修复

**背景**：内训课/公开课列表存在明显测试数据（如 `11111111`、`测试课程1512`、`张三的课李四发` 等）。

**操作**：

1. 新增 Flyway 脚本 `V66__purge_obvious_test_courses.sql`，按规则删除测试课及关联 `course_plans`、`course_enrollments`、`training_reviews`、`user_favorites`、`user_likes`、`carts`、`demands.source_course_id`。
2. 同步维护手工脚本 `data-trans/scripts/_purge_obvious_test_courses.py`（逻辑与 V66 一致），在 `v3test` **手工执行两轮**，共删除约 **84** 条课程及相关计划。
3. 首次 Flyway 执行 V66 时因脚本中误用表名 `favorites` / `training_demands`（实际为 `user_favorites` / `demands`）导致 **迁移失败**，`flyway_schema_history` 写入 `success=0`。
4. 修正 V66 SQL 表名后，后端重启仍失败（Flyway 检测到 failed migration）。
5. 执行 `data-trans/scripts/_fix_flyway_v66.py` 删除失败记录，重启后端；V66 重新执行成功，API 恢复。

**教训**：

- 数据清理类脚本必须先核对**真实表名**（以 `db/migration` 历史脚本为准）。
- **不要**在 Flyway 失败未 repair 的情况下反复手工改数据并重启——后端会一直起不来。
- 手工 Python 清理与 Flyway 脚本应同步维护，且 Flyway 脚本必须幂等。

**相关文件**：

- `backend/taoke-app/src/main/resources/db/migration/V66__purge_obvious_test_courses.sql`
- `data-trans/scripts/_purge_obvious_test_courses.py`
- `data-trans/scripts/_fix_flyway_v66.py`
- `data-trans/output/_purge_test_courses_applied.json`（删除明细快照）

### 2026-05-23 — V64 / V65 课程分类子类与案例索引

**V64 `seed_course_category_l2`**：按 `TRAINER_EXPERTISE` 二级分类名称，为 `COURSE_CATEGORY` 补全对应二级子类（`NOT EXISTS` 幂等 INSERT）。

**V65 `add_trainer_cases_status_id_index`**：为 `user_trainer_cases (status, id)` 建索引 `idx_trainer_cases_status_id`，修复「最近已审核案例」列表 `ORDER BY` 时 `Out of sort memory`。

**相关文件**：

- `backend/taoke-app/src/main/resources/db/migration/V64__seed_course_category_l2.sql`
- `backend/taoke-app/src/main/resources/db/migration/V65__add_trainer_cases_status_id_index.sql`

---

### 2026-05-23 — V67 录播课封面 URL 规范化 + checksum repair

**背景**：C 端录播课列表大量封面为占位图；`videos` / `video_series` / `video_chapters` 的 `cover_url` 存的是 FSM hash、OSS 相对路径、`/attachments/` 等，前端 `media.ts` 无法直接加载。

**操作**：

1. 新增 `V67__normalize_video_cover_urls.sql`：按规则将非空 `cover_url` 规范为 `https://preview.kuanxue.com/fsm/`、`https://cdn5-pxb-videos.taoke.com/`、`https://www.taoke.com/...` 等绝对 URL；**不更新**本即为空的字段。
2. 同步前端 `frontend/src/lib/media.ts` 对未入库前的相对路径做兜底解析。
3. 在 `v3test` 由 Flyway 随后端启动执行 V67；脚本提交后曾再次编辑，触发 **checksum 不匹配**（库内 `-1551381291` vs 本地 `-524896563`），后端无法启动。
4. 执行 `data-trans/scripts/_fix_flyway_v67_checksum.py`，将 `flyway_schema_history` 中 V67 的 checksum 更新为 `-524896563`，重启后端成功。

**可选手工预览**（不替代 Flyway，仅审计统计）：

```bash
python data-trans/scripts/run_video_cover_normalize.py
```

**相关文件**：

- `backend/taoke-app/src/main/resources/db/migration/V67__normalize_video_cover_urls.sql`
- `data-trans/scripts/run_video_cover_normalize.py`
- `data-trans/scripts/_fix_flyway_v67_checksum.py`
- `frontend/src/lib/media.ts`

**教训**：V67 为纯 UPDATE、按条件幂等；但若 Flyway 已成功执行后再改 SQL 文件，必须 repair checksum 或回滚文件内容。

---

### 2026-05-25 — V68 专家标量字段回填 + checksum repair + 分类 Python 补数

**背景**：专家列表/详情大量缺失「擅长领域、擅长行业、关键标签、头衔」；迁移阶段未写入 `trainer_expertise_categories` / `trainer_industry_categories`，且 `expertise_tags` 多为空。

**操作**：

1. 新增 `V68__backfill_trainer_expertise_from_legacy.sql`（Flyway 部分）：
   - 从老库 `taoke.tk_member_ext.job` 回填 `user_trainers.title`（`LEFT(..., 64)`，与列 `VARCHAR(64)` 一致）；
   - 从 `taoke.tk_member.goodat` 回填 `user_trainers.expertise_tags`。
2. **分类关联表**不在 Flyway 中 INSERT（需跨库映射 `tk_cate` / `tk_trade` → `sys_categories`），在同实例执行：
   ```bash
   python data-trans/scripts/run_trainer_fields_backfill.py
   ```
3. 头衔仍缺的数据（无 `job`）另用 `data-trans/scripts/_backfill_trainer_title.py` 从 `teaching_style` / `intro` 首行补全（**非 Flyway**，手工/按需执行）。
4. `v3test` 上 Flyway 于 **2026-05-25** 成功应用 V68（`success=1`）；随后将 V68 中 title 长度由 `255` 改为 `64` 以匹配表结构，DevTools 重启触发 checksum 不匹配（库内 `1298074380` vs 本地 `-100945177`），8080 不可用、前端「网络连接失败」。
5. 执行 `data-trans/scripts/_fix_flyway_v68_checksum.py`，checksum 更新为 `-100945177`，重启后端恢复。

**v3test 补数效果（参考）**：

| 指标 | 补数前（约） | 补数后（已发布专家） |
|---|---|---|
| 有擅长领域分类 | 21 | 7093 |
| 有擅长行业分类 | 7 | 6308 |
| 有 expertise_tags | ~20 | 2150 |
| 有 title | ~864 | 4813+（含 Python title 脚本） |

**相关文件**：

- `backend/taoke-app/src/main/resources/db/migration/V68__backfill_trainer_expertise_from_legacy.sql`
- `data-trans/scripts/run_trainer_fields_backfill.py`
- `data-trans/scripts/_backfill_trainer_title.py`
- `data-trans/scripts/_fix_flyway_v68_checksum.py`
- `data-trans/scripts/sql_generator.py`（新迁移专家默认写入 `goodat` → `expertise_tags`）

**教训**：

- 依赖老库 `taoke` 的 Flyway 脚本**仅能在老库与新库同 MySQL 实例**的环境执行。
- 标量回填与关联表回填应写清执行顺序：先 Flyway V68，再 `run_trainer_fields_backfill.py`。
- 已执行的 V68 **勿再改**；若需扩展 title 规则，应新增 **更高版本**（如 V69）而非修改 V68。

---

### 2026-05-25 — V69 专家案例零日期修复

**背景**：专家详情页「授课案例」Tab 接口 `/trainers/{id}/cases` 返回 500；SSR 侧 `.catch(() => [])` 导致 Tab 计数显示为 0。根因为老站迁移残留的 `user_trainer_cases.created_at = 0000-00-00`（或 NULL），JPA / Jackson 无法解析为 `LocalDateTime`。

**操作**：

1. 新增 `V69__fix_trainer_case_zero_datetimes.sql`（Flyway 部分）：
   - `user_trainer_cases`：`created_at` 为 NULL 或 `< 1971-01-01` 时，用 `updated_at` → `training_date 00:00:00` → `NOW()` 回填；
   - `user_trainer_case_files`：同类零日期用 `updated_at` → `NOW()` 回填。
2. 同问题另有手工脚本 `data-trans/scripts/fix_trainer_cases_books.py`（零日期修复 + 从 `taoke.tk_trainer_books` 补迁著作到 canonical `trainer_id`，**非 Flyway**）。
3. 与「同名双行专家、子资源挂在 donor 行」问题配合：先 `merge_trainer_duplicate_resources.py` 归并资源，再 V69 清零零日期（见 `data-trans/docs/problem/专家详情子资源挂错id-原因与修复.md`）。

**相关文件**：

- `backend/taoke-app/src/main/resources/db/migration/V69__fix_trainer_case_zero_datetimes.sql`
- `data-trans/scripts/fix_trainer_cases_books.py`
- `data-trans/scripts/merge_trainer_duplicate_resources.py`
- `data-trans/docs/problem/专家详情子资源挂错id-原因与修复.md`

**教训**：

- MySQL 零日期在 Java 21 + JPA 下会直接抛异常，数据清洗宜尽早 Flyway 化，避免仅依赖 Python 手工脚本。
- 专家详情「案例 Tab 为 0」需区分：**接口 500**（零日期）与 **trainer_id 挂错**（合并脚本）两类根因。

---

### 2026-05-23 — V70 / V71 机构公开列表过滤

**背景**：C 端机构列表混入大量「专家发课 organid」行（`mold=2`、无公司名），展示为人名 + 头像，与机构频道语义不符。

**操作**：

1. **V70 `institution_public_list_eligible`**：`user_institutions` 新增 `public_list_eligible`；默认 0，按机构类型 / 机构课 / 名称正则等规则设为 1；后端公开列表 API 增加该字段过滤。
2. **V71 `tighten_institution_public_list`**：收紧规则，排除「仅有 `publisher_type=TRAINER` 课、无机构课」的专家发课账号；并将应隐藏行 `status=2`，使未重启后端时旧 API（仅筛 `status=1`）也立即生效。

**v3test 效果（参考）**：可展示机构约 **10,538** 条（V71 后进一步减少混入项）。

**相关文件**：

- `backend/taoke-app/src/main/resources/db/migration/V70__institution_public_list_eligible.sql`
- `backend/taoke-app/src/main/resources/db/migration/V71__tighten_institution_public_list.sql`
- `data-trans/docs/problem/机构列表混入专家-原因与修复.md`

---

### 2026-05-25 — V72 / V73 机构 Logo URL 规范化与回填

**背景**：机构列表/详情 Logo 不显示；`logo_url` 多为 `attachments/`、`u/` 相对路径，或 partner 迁移行（低 id）为空而同 `org_name` 的 organ 行有图。

**操作**：

1. **V72 `normalize_institution_logo_urls`**：将相对路径补全为 `https://www.taoke.com/...`；`http://www.taoke.com/` 统一为 `https`（规则对齐 V67 录播封面）。
2. **V73 `backfill_institution_logos_from_duplicates`**：
   - 同名机构：从已有非空 `logo_url` 行复制（`ROW_NUMBER() OVER (PARTITION BY org_name ORDER BY id DESC)`，避免 `GROUP_CONCAT` 默认长度截断）；
   - 再次执行 V72 路径规范化（幂等）。
3. **v3test 首次执行 V73 失败**（`success=0`）：长事务 UPDATE 触发 **Lock wait timeout**；早期脚本草稿曾用 `GROUP_CONCAT` 聚合同名 logo，存在截断风险。
4. 修正 V73 SQL 后，执行 `data-trans/scripts/_repair_flyway_v73.py` 删除失败记录，重启后端；V73 重新执行 **`success=1`**。
5. 仍缺 logo 的个别机构（老库无 organ 图源）由运行时 `InstitutionServiceImpl.fillMissingLogos()` 按机构名兜底；样例 id 4/8/9 另用手工脚本 `_patch_sample_institution_logos.py` 补数（**非 Flyway**）。

**相关文件**：

- `backend/taoke-app/src/main/resources/db/migration/V72__normalize_institution_logo_urls.sql`
- `backend/taoke-app/src/main/resources/db/migration/V73__backfill_institution_logos_from_duplicates.sql`
- `data-trans/scripts/_repair_flyway_v73.py`
- `data-trans/scripts/_patch_sample_institution_logos.py`

**教训**：

- 大批量 UPDATE 优先分批或缩小 JOIN 范围，避免与手工 Navicat 会话争抢行锁。
- 聚合「每 org_name 取一条 logo」应用窗口函数，勿依赖默认 `group_concat_max_len` 的 `GROUP_CONCAT`。

---

### 2026-05-25 — V74 内训课分类 ID 对齐 sys_categories

**背景**：内训课侧栏「课程分类」筛选无效；迁移阶段将老 `tk_courseinfo.cid` 写入 `courses.sub_category_id`（老 `tk_cate` ID），与新版 `sys_categories` 树 ID 不一致，后端按 L2 id 过滤结果为 0。

**操作**：

1. 新增 `V74__remap_internal_course_categories.sql`：内训课（`type=INTERNAL`、`status=2`）通过 `taoke.tk_cate.name` = `sys_categories.name`（`type=COURSE_CATEGORY`）映射，回写 `category_id`（L1）与 `sub_category_id`（L2）。
2. **依赖**：老库 `taoke` 与新库 `v3test` 须为**同一 MySQL 实例**（与 V68 相同约束）。
3. `v3test` Flyway 执行 **`success=1`**；配合后端 `resolveExpandedCourseCategoryIds()`（L1 展开 + 双字段匹配），API 验证 L2 `categoryIds=304` 约 **1241** 条（修复前为 0）。

**相关文件**：

- `backend/taoke-app/src/main/resources/db/migration/V74__remap_internal_course_categories.sql`
- `data-trans/scripts/_run_v74_internal_categories.py`（可选预览/审计，**非 Flyway**）
- `frontend/src/features/course/components/inner/InnerCourseFilters.tsx`

**教训**：

- 跨库名称映射类回填应尽早 Flyway 化，避免前端/后端已按新 ID 开发而数据仍为 legacy ID。
- V74 仅处理 `sub_category_id > 0` 的内训课；无老分类关联的行需另案补数。

---

### 2026-05-25 — V75 排除「公司名专家 organ」（CareerPower / 31513 类）

**背景**：机构 id=31513（安秋明 / CareerPower）在新站展示为培训机构，老站 ` /company/31513` 为 404；老库 23 门课均为 mold=2 讲师课，无合伙人入驻。V71 因 `org_name` 含「有限公司」仍放行。

**操作**：

1. 新增 `V75__exclude_trainer_only_organs_with_company_name.sql`：非合伙人、无已发布机构课、且有讲师课或 `user_trainers` 档案 → `public_list_eligible=0`，并 `status=2`（与 V71 互补，**不再依赖名称正则**）。
2. v3test 预查：id=31513 已为 `status=2`、`public_list_eligible=0`（可能由 V71 二次下线脚本先行处理）；同类仍 `status=1` 且 `eligible=1` 的行 **0** 条。
3. 排查文档：`data-trans/docs/problem/机构31513-CareerPower-原因与修复.md`；可选手工：`python data-trans/scripts/run_v75_trainer_only_organs.py`。

**相关文件**：

- `backend/taoke-app/src/main/resources/db/migration/V75__exclude_trainer_only_organs_with_company_name.sql`
- `data-trans/scripts/run_v75_trainer_only_organs.py`
- `data-trans/scripts/_audit_institution_31513.py`

---

### 2026-06-12 — 录播课后台 data-trans 迁移脚本（非 Flyway）

**背景**：录播课管理后台（供应商/订单/评论）需老站数据；V96/V97 仅做 schema，不承载批量迁库。

**data-trans 脚本**（执行顺序见 `data-trans/docs/guides/录播课迁移操作手册.md`）：

1. `_audit_video_migration_gaps.py` — 缺口审计
2. `run_video_package_migrate.py` — `video_package_*`
3. `run_video_supplier_migrate.py` — `video_suppliers*`
4. `run_video_order_migrate.py` — `orders` / `video_enrollments`（默认 `status=3`）
5. `run_video_comment_migrate.py` — `video_comments`
6. `_audit_video_migration_verify.py` — 验收

**相关 Flyway**：V86–V87（视频包）、V96–V97（供应商/评论审核/发票列）。

**说明**：历史发票不迁移；迁移订单 `remark` 含 `[legacy-import]` 便于回滚（`_rollback_video_migration.py`）。

---

## 8. 快速命令参考

### 8.1 Python 辅助脚本（dev 库 v3test，`10.0.14.20`）

```bash
# 查看最近 Flyway 记录（临时脚本，见上文 §3.3）

# 删除某版本失败记录（success=0），示例 V66 / V73
python data-trans/scripts/_fix_flyway_v66.py
python data-trans/scripts/_repair_flyway_v73.py

# Checksum repair（版本已 success=1 但本地 SQL 被改过）
python data-trans/scripts/_fix_flyway_v67_checksum.py   # → -524896563
python data-trans/scripts/_fix_flyway_v68_checksum.py   # → -100945177

# 新增/修改迁移脚本后的启动风险自检（见 §4.4）
python data-trans/scripts/_validate_flyway_migration.py --version 131
python data-trans/scripts/_validate_flyway_migration.py   # 检查全部脚本

# 与 Flyway 配套的老站数据补数（非 Flyway 历史表）
python data-trans/scripts/run_video_cover_normalize.py      # V67 逻辑预览/统计
python data-trans/scripts/run_trainer_fields_backfill.py    # V68 分类表 INSERT
python data-trans/scripts/_backfill_trainer_title.py        # title 扩展回填

# 录播课老站迁库（见 §7 2026-06-12）
python data-trans/scripts/_audit_video_migration_gaps.py
python data-trans/scripts/run_video_package_migrate.py --dry-run
python data-trans/scripts/run_video_supplier_migrate.py --dry-run
python data-trans/scripts/run_video_order_migrate.py --dry-run
python data-trans/scripts/run_video_comment_migrate.py --dry-run
```

### 8.2 验证后端已恢复

```powershell
netstat -ano | findstr ":8080"
curl http://localhost:8080/actuator/health
```

---

## 9. 检查清单（发布前）

- [ ] 新脚本版本号大于当前最大成功版本
- [ ] 脚本 UTF-8 编码，中文注释可读
- [ ] 已在测试库启动成功，`flyway_schema_history.success = 1`
- [ ] 未修改已执行过的旧迁移文件
- [ ] 若含 DELETE/UPDATE  bulk 操作，已评估幂等与关联表
- [ ] 与 `data-trans` 手工脚本无冲突，或已明确执行顺序

---

## 10. 参考

- 架构说明：`docs/02-架构设计.md`
- 重构介绍（Flyway 约定）：`docs/淘客网重构项目介绍.md`
- 历史开发记录（各 V 版本背景）：`docs/process/works.md`
- 老站数据迁移：`data-trans/docs/guides/数据迁移操作手册.md`
