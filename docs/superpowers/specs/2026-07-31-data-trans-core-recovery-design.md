# data-trans 核心迁移脚本恢复设计

**日期：** 2026-07-31
**范围：** `data-trans/scripts/` 核心老站迁移链路
**目标：** 恢复文档明确点名且迁库主干需要的脚本，使它们具备可审计、可 dry-run、可回滚的功能等价实现。

## 1. 背景

当前仓库中 `data-trans/` 属于本地迁移工具区，`.gitignore` 只保留了 `_validate_flyway_migration.py`，多数历史迁移脚本没有纳入 Git。现存线索包括：

- `docs/guides/data-trans-migration.md`：记录脚本清单、职责和执行顺序。
- `docs/guides/flyway-operations.md`：记录 Flyway 与 data-trans 的边界、历史事件和 checksum repair 经验。
- `docs/superpowers/plans/2026-06-12-video-remaining-migration.md`：记录录播课剩余迁移的状态映射和验收要求。
- `backend/taoke-app/src/main/resources/db/migration/`：提供目标表结构、字段演进和部分跨老库回填 SQL。
- `v3test.sql`、`tkw/`、后端 Entity/Repository/Service：用于交叉确认老站字段、目标字段和业务语义。

本次恢复不追求逐行复原已经丢失的本地脚本，而是恢复可维护的功能等价版本。

## 2. 恢复脚本

本次恢复以下核心脚本：

| 脚本 | 职责 |
|---|---|
| `run_trainer_fields_backfill.py` | 按老站讲师擅长领域/行业回填 `trainer_expertise_categories`、`trainer_industry_categories` |
| `_audit_video_migration_gaps.py` | 迁移前审计录播课、视频包、供应商、订单、评论缺口 |
| `run_video_package_migrate.py` | 迁移视频包标签、包分组、视频与包/专题关系 |
| `run_video_supplier_migrate.py` | 迁移录播课供应商、供应商分类和分类视频 |
| `run_video_order_migrate.py` | 迁移录播课历史订单、支付记录和报名/学习授权 |
| `run_video_comment_migrate.py` | 迁移录播课评论 |
| `_audit_video_migration_verify.py` | 迁移后验收统计，输出通过/失败和差异明细 |
| `_rollback_video_migration.py` | 回滚带迁移标记的数据，支持 dry-run 预览 |

## 3. 共享工具

新增 `data-trans/scripts/lib/`，放置共享能力：

- `db.py`：解析 `OLD_MYSQL_DSN` / `SOURCE_MYSQL_DSN` / `NEW_MYSQL_DSN` / `TARGET_MYSQL_DSN`，创建 PyMySQL 连接。
- `ident.py`：校验并转义表名、列名，避免参数化脚本拼接任意 SQL 标识符。
- `runtime.py`：统一 `--dry-run` / `--apply`、批大小、输出目录、统计打印。
- `legacy.py`：老站路径、金额、时间、状态、布尔值等通用转换函数。

共享工具保持小而稳定，脚本自身只保留各自领域的映射和 SQL。

## 4. 安全边界

- 所有新增迁移脚本默认 dry-run，不写库；只有显式传入 `--apply` 才提交事务。
- 执行写入前打印源库、目标库、目标表、批大小和迁移范围。
- 跨库读取老站 `taoke.*` 时允许通过参数覆盖库名，不把环境写死在脚本里。
- 批量写入使用幂等策略：目标记录存在则跳过或按空字段补齐，不无条件覆盖人工维护字段。
- 订单迁移写入 `remark` 标记 `[legacy-import]`，回滚脚本只处理带该标记或明确 legacy 来源的数据。
- 回滚脚本先删除依赖表，再删除主表，所有删除动作支持 dry-run 统计。
- 不把敏感 DSN、导出明细和执行日志提交到 Git。

## 5. 数据映射策略

### 5.1 讲师分类回填

优先从 Flyway V68 和文档记录恢复：

- 老站 `tk_member.goodat` 回填标量标签由 Flyway 负责。
- data-trans 负责关系表 INSERT：
  - `tk_cate` / `tk_trade` 与 `sys_categories` 按名称、类型和父子层级映射。
  - 目标表为 `trainer_expertise_categories` 和 `trainer_industry_categories`。
  - 只为已存在的新站讲师建立关系，不创建讲师主档。

### 5.2 录播课迁移

录播课迁移按文档顺序拆分：

1. `_audit_video_migration_gaps.py` 先输出源/目标差异。
2. `run_video_package_migrate.py` 迁移包、标签、分组和视频关系。
3. `run_video_supplier_migrate.py` 迁移供应商和分类关系。
4. `run_video_order_migrate.py` 迁移订单、支付和报名，默认只迁移老站已支付状态。
5. `run_video_comment_migrate.py` 迁移评论，孤儿评论进入跳过统计。
6. `_audit_video_migration_verify.py` 复核关键数量和可追溯标记。
7. `_rollback_video_migration.py` 在需要时按依赖顺序回滚本批导入。

## 6. 测试策略

先补测试，再实现脚本核心逻辑：

- 订单状态映射：老站 `status=3` 映射为已支付，其余默认跳过。
- 金额转换：分、元、字符串金额统一转为 `Decimal`。
- URL 规范化：相对路径按老站资源域名补齐，空值保留为空。
- 标识符校验：非法表名/列名被拒绝。
- 回滚筛选：只选择带 `[legacy-import]` 或明确 legacy 标记的数据。
- dry-run 行为：不会提交事务，统计仍完整输出。

测试不依赖真实 MySQL，优先覆盖纯函数和 SQL 构造边界。真实库执行通过 `--dry-run` 和审计脚本人工确认。

## 7. 验收标准

- `uv run pytest data-trans/tests` 通过。
- 每个恢复脚本支持 `--help` 并能展示用途、DSN 参数、`--dry-run`、`--apply`。
- dry-run 是默认行为，误执行时不会写库。
- 核心脚本输出迁移统计和跳过原因。
- 回滚脚本只能回滚本次 legacy 导入范围，不影响新站正常业务数据。
- 不修改 Flyway SQL，不执行数据库写入，不提交本地输出文件。

## 8. 非目标

- 不恢复所有历史一次性排查脚本。
- 不迁移历史发票。
- 不直接启动后端或触发 Flyway。
- 不把 `data-trans/output/`、日志或数据库备份纳入 Git。
