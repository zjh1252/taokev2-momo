# 公开课老站 SEO 编号对齐设计

**日期**：2026-07-30  
**来源**：新老站同一课编号不一致（例：老 `/opencourse/438103.htm` vs 新 `/opencourse/276819.htm`），影响 SEO  
**策略**：方案 A — 老 URL 200 直达；对外编号与站内主链用老场次纯数字编号  
**已确认**：方案 A；展示为纯数字（如 `438103`，不加 `TK-` 前缀）

## 1. 目标与非目标

### 目标

1. 老站形态 URL `/opencourse/{legacyPlanId}.htm`（如 `438103`）在新站 **HTTP 200** 打开对应公开课内容（不断链、不强制 301）。
2. 页面「课程编号」（Hero + 开课计划表）对外显示 **纯数字老场次号**。
3. 站内公开课主链接优先生成 `/opencourse/{legacyPlanId}.htm`，与老站收录 URL 一致。

### 非目标（本轮不做）

- 修改 `courses.id` 主键或全量重迁课程 ID
- 内训课 `/inhousecourse` 编号改造
- 新建 Flyway 列 `legacy_plan_id`（本轮复用 `course_plans.sort_order`；后续可正式迁列）
- 废除内部兼容路径 `/opencourse/TK-{courseId}-{seq}.htm`（可保留，但不作为对外主链）
- 搜索引擎 sitemap / robots 全量重刷（可另开任务）

## 2. 现状与根因

| 概念 | 老库 | 新库 | 老站 SEO 用法 |
|------|------|------|----------------|
| 课程主档 | `tk_courseinfo.id`（例 `276819`） | `courses.id` | 一般不进公开课详情 URL |
| 开课场次 | `tk_course.id`（例 `438103`），`cid→courseinfo` | `course_plans` 行；**`sort_order` 存老 `tk_course.id`** | URL `/opencourse/{tk_course.id}.htm`，编号显示同数字 |

迁移保留了 `courses.id = tk_courseinfo.id`，但 C 端详情 URL / Hero 编号按 **`courses.id`** 生成，导致与老站场次编号不一致。机构侧已有先例：`user_institutions.legacy_role_id` + `resolvePublicByPathId`。

## 3. 设计

### 3.1 路径解析（后端）

扩展公开详情解析（对齐机构 `resolvePublicByPathId`）：

`GET /courses/{pathId}`（公开详情，不含 bumpView 分支）：

1. 若存在已上架课程且 `courses.id = pathId` → 返回该课详情。
2. 否则查 `course_plans.sort_order = pathId`，取关联 `course_id`，若课程已上架 → 返回该课详情。
3. 否则 404。

冲突约定：同一 `pathId` 既是某课主键又是另一课场次 legacy 时，**优先 `courses.id`**（与机构「先 legacy 再 id」相反；因本库主键语义是 courseinfo，场次号多在 40 万段，实测冲突面更小且保留 `276819` 直达能力）。若后续审计发现冲突，再改为「公开课优先 legacy 场次」。

可选：详情 VO 增加：

- `displayCourseNo`：对外展示编号（字符串/整数，纯数字）
- 或每场 `CoursePlanDTO` 明确文档化：`sortOrder` 即 legacy 场次 ID（`>0` 时可用于 SEO）
- 列表项可增加 `seoPathId` / `legacyPlanId`（最近一场有效开课的 `sort_order`），供卡片链出

本轮最小集：

- 详情解析支持 legacy 场次 ID
- Plan DTO / 列表项暴露可用于 SEO 的场次号（优先复用已有 `sortOrder` 字段并在 API 注释写清；列表若无 plans，则增 `legacyPlanId` 或 `seoPathId`）

### 3.2 前端路由与页面

- `proxy` 已有：`/opencourse/{id}.htm` → `/opencourses/{id}`；**无需改 path 形态**。
- `opencourses/[id]/page.tsx`：继续 `getCourseDetail(Number(id))`；后端解析升级后，`id=438103` 即可拉到课 `276819`。
- 若 URL 命中的是 legacy 场次：页面可将该 `id` 作为「当前展示编号」与计划表高亮依据（匹配 `plan.sortOrder === pathId`）。

### 3.3 展示（纯数字）

| 位置 | 规则 |
|------|------|
| Hero「课程编号」 | URL pathId 若等于某场 `sortOrder` → 显示该数字；否则取**最近一场**（`startTime >= now` 优先，否则最近一场）的 `sortOrder`；若无有效 legacy（`sortOrder` 空/0）→ 回退 `courses.id` |
| 开课计划表「课程编号」列 | 每行显示该行 `sortOrder`（有值）；无则回退生成策略不再用 `TK-{courseId}-{n}` 作为对外主文案（可改为 `courses.id` 或隐藏，优先 `sortOrder`） |
| 计划详情页 `OpenCoursePlanHero` | 若该 plan 有 `sortOrder`，显示纯数字；外链主路径改为 `/opencourse/{sortOrder}.htm` |

**禁止**对外主展示再使用 `TK-276819` / `TK-276819-1` 作为课程编号（内部 `TK-` 路由可保留兼容）。

### 3.4 站内链接

统一工具（建议扩展 `getCourseDetailPath` / 新增 `getOpenCourseSeoPath`）：

- 公开课：若有 `legacyPlanId` / 最近场次 `sortOrder` → `/opencourse/{legacyPlanId}.htm`
- 否则 → `/opencourse/{courseId}.htm`
- 内训课不变：`/inhousecourse/{id}.htm`

替换点：`OpenCourseCard`、专家/机构侧栏课程链、城市频道、搜索结果中公开课入口等凡硬编码 `/opencourse/${course.id}` 处。

### 3.5 `TK-` 计划 URL

- 保留 rewrite：`/opencourse/TK-…` → plan 页（兼容已发出的链接）。
- 新生成的站内主链与计划表跳转：**优先纯数字 legacy**。
- 不在本轮做 `TK-` → 数字的全站 301。

## 4. 验收用例

| # | 操作 | 期望 |
|---|------|------|
| 1 | 打开 `/opencourse/438103.htm` | 200；标题为「向 HW 学习流程体系建设与高效运营」；编号显示 `438103` |
| 2 | 打开 `/opencourse/276819.htm` | 200；同一门课；编号优先最近场次 legacy（有则非强制显示 276819） |
| 3 | 列表点击该课 | 地址栏为 `/opencourse/438103.htm`（或该课最近场次 legacy），不是误用无 legacy 的错链 |
| 4 | 计划表该行编号 | 纯数字 `438103`，无 `TK-` 前缀 |
| 5 | 无 `sort_order` 的新发公开课 | 仍可用 `/opencourse/{courses.id}.htm`，编号回退主键数字 |

## 5. 风险与后续

- **`sort_order` 语义过载**：本轮借用迁移写入的老场次 ID；后台若按「排序」改写该列会破坏 SEO。后续应 Flyway 增加 `legacy_plan_id` 并回填，排序与 legacy 分离。
- **多场次多 URL**：一门课对应多个老 URL，均 200 到同一课程详情（可高亮不同场次）——与老站「一场一页」一致。
- **ID 冲突**：见 §3.1；上线前可用脚本抽查 `courses.id ∩ course_plans.sort_order` 交集规模。

## 6. 实现边界

- 后端：`taoke-course` 公开详情解析 + DTO/列表 SEO 字段（按最小集）
- 前端：`frontend` 展示、路径工具、公开课卡片/详情相关引用
- 测试：后端解析单测；前端 path/编号纯函数单测；手工验 `438103`
