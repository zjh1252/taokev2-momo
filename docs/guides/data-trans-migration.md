# 老站数据迁移（data-trans）规范

本文档约定 **老站 `taoke` → 新库** 的数据迁移脚本放置与执行规则。Flyway 运维见 [flyway-operations.md](./flyway-operations.md)。

## 目录约定

**所有老站数据迁移相关脚本、产出、排查文档一律放在 `data-trans/` 下**，禁止散落在 `backend/`、`scripts/` 仓库根目录或其它位置。

```
data-trans/
├── scripts/          # Python 迁移 / 补数 / 审计脚本（唯一入口）
├── output/           # 脚本生成的 SQL、JSON 快照
├── docs/
│   ├── guides/       # 操作手册
│   └── problem/      # 问题排查记录
├── logs/             # 执行日志
└── backup/           # 本地备份
```

| 类型 | 位置 | 说明 |
|------|------|------|
| 批量迁库、补数、审计 | `data-trans/scripts/` | 如 `run_trainer_fields_backfill.py` |
| 一次性 SQL 产出 | `data-trans/output/` | 手工执行前需 review |
| 排查与操作说明 | `data-trans/docs/` | 可单独提交 Git（`data-trans/` 整体在 `.gitignore`，本地保留） |
| Schema 演进、种子基线 | `backend/.../db/migration/` | **仅 Flyway**，不承载大批量老站迁库 |

## 边界规则

1. **Flyway**：新系统表结构、可重复的环境增量、与启动绑定的标量回填（如 `V68` 的 `title`/`expertise_tags` UPDATE）。
2. **data-trans**：跨库 `taoke` 读取、大批量 INSERT、审计、一次性修复、Flyway 失败后的手工 repair 脚本。
3. **禁止**只手工改库而不落脚本；Flyway 与 data-trans 逻辑重叠时，**两边同步维护**并在 `flyway-operations.md` §7 记 changelog。
4. **禁止**用 Flyway 承载需频繁重跑的全量迁库；此类任务放 `data-trans/scripts/`。
5. 地区等已由 Flyway 写入的基线表（如 `common_regions`），data-trans **不得覆盖**。

## 脚本规范

- 语言：Python 3，`pymysql` + `.env` 数据库配置。
- 命名：`run_<场景>.py`（正式管道）、`_audit_<主题>.py`（审计）、`_fix_<主题>.py`（一次性修复）。
- 必须支持 `--dry-run`（新脚本强制，旧脚本逐步补齐）。
- 注释与日志：中文；敏感信息不写进仓库。
- 执行环境：`conda activate common-ai`（与仓库约定一致）。

## 典型执行顺序（专家擅长领域示例）

1. Flyway 标量回填（如 `V68__backfill_trainer_expertise_from_legacy.sql`）— 随后端启动。
2. `python data-trans/scripts/run_trainer_fields_backfill.py` — 分类关联表 INSERT。
3. 可选：`python data-trans/scripts/_backfill_trainer_title.py` — 头衔扩展。

详见 `data-trans/README.md` 与 `data-trans/docs/guides/数据迁移操作手册.md`。

## 相关源码

- 老站 PHP：`tkw/`（只读对照，不入新站部署）
  - 专家列表底部分类 UI：`tkw/templates/front/trainer_list.html`
  - 一级领域筛选：`tkw/trainerlist.php`（`categoryIds = cid`）
  - 底部分类数量：`tkw/shell/statics_resourse_for_cate.php`（`trainercount`，`membercate_relation.cid = 一级ID`）
- 新站 Flyway：`backend/taoke-app/src/main/resources/db/migration/`
