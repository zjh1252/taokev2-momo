# 课程封面必填 + 专家页四人一组 + 专家页性能优化设计

## 背景

1. 公开课 / 内训课在正式提交时已要求课程封面；录播课封面仍可选；草稿与管理后台创建路径未统一强制。
2. 专家列表页「热门培训领域」横滑大卡当前每组 3 人，需改为每组 4 人。
3. 专家页 RSC 请求 `trainer?_rsc=...` 总耗时约 3.32s，其中 Content Download 约 3.27s、TTFB 约 44ms，主因是 flight payload 过大，而非单纯 DB 等待。

## 目标与非目标

### 目标

| 项 | 成功标准 |
|----|----------|
| 封面必填 | C 端 + Admin，公开课 / 内训课 / 录播课，创建与草稿保存均要求 `coverUrl` |
| 四人一组 | 「热门培训领域」一屏完整露出 4 张大卡，滑动仍按 4 人翻页 |
| 专家页 RT | 同机同网下 `trainer?_rsc` Content Download 从 ~3s 量级降到亚秒～1s 级（预估，需压测复核）；C 端卡片展示不变；培训宝 embed 仍有课程标题 |

### 非目标

- 不强制回溯改写历史无封面已上架数据（仅写接口拦截）
- 不改「领域推荐专家」条人数（筛选领域后顶部 3 人保持不变）
- 不改专家详情页「相关推荐」等其它写死为 3 的推荐位
- 不涉及版权课发布封面流程
- 不拆微服务、不换 ORM

## 决策摘要

| 决策点 | 选择 |
|--------|------|
| 封面生效时机 | C：C 端 + Admin，含草稿一律必填 |
| 四人一组范围 | A：仅「热门培训领域」横滑区 |
| 性能深度 | B：P0 瘦身 + 更深后端（缓存 / 按需 enrich / 有证据再加索引） |
| 总体方案 | 方案 2：全链路同步加固 |

---

## §1 课程封面必填

### 数据模型

- 课程（公开课 / 内训课）：`Course.coverUrl`
- 录播课：`Video.coverUrl`
- 无独立 thumbnail / banner 字段

### 后端（权威校验）

- `CourseServiceImpl`：创建 / 更新时，**无论 `draft` 是否为 true**，`coverUrl` 空白一律拒绝，文案「请上传课程封面」
- `VideoServiceImpl`：同样规则
- 封面校验与「提交审核字段完整性」共用；草稿路径不得绕过
- DTO 可不加 `@NotBlank`（以 service 为准，避免与其它字段分层校验冲突）

### C 端

- `CourseForm`：草稿保存与正式提交均校验封面
- `VideoForm`：封面标必填；草稿 / 提交均拦截；自动截帧成功则视为已填

### Admin

- 课程创建 / 编辑：补封面上传（或 URL）字段，Zod `coverUrl` 必填
- 录播课创建 / 编辑：`coverUrl` 从 optional 改为必填

### 兼容

- 已有无封面草稿：下次保存失败，需先补封面
- 已上架历史数据不强制 Flyway 回填

---

## §2 「热门培训领域」四人一组

### 前端

| 位置 | 改动 |
|------|------|
| `TrainerRecommendedScroller.tsx` | `CARDS_PER_PAGE`：`3` → `4`；调整卡宽 / 容器，保证一屏 4 张无半卡裁切 |
| `trainers/page.tsx` | `loadTrainerListRecommended(9)` → `12` |
| `loaders.ts` / 客户端补取 | 默认 limit / `getTopRecommendedTrainers` 同步为 `12` |

### 后端 / CMS

- `/trainers/recommended` 默认 limit：`9` → `12`
- CMS 位 `TRAINER_LIST_TRAINER`：运营宜配满 12 条 PRIMARY；不足时仍走现有 fallback 补齐

### 明确不动

- `TrainerCategoryExpertBar`（领域推荐专家，仍 3）
- 详情页相关推荐 limit=3

---

## §3 专家页 RT 优化

### 瓶颈诊断（预估）

| 分段 | 现象 | 证据 | 占比预估 |
|------|------|------|----------|
| 前端 RSC | Content Download ~3.27s，TTFB ~44ms | DevTools Timing | ~80%+ |
| 应用编排 | 列表 SSR 等分类树解析后才请求；industry tree 重复取 | `trainers/page.tsx` | 中 |
| JPA / 跨模块 | 列表默认走 `TrainerListItemCourseEnricher`（课程数 + 标题） | `TrainerListItemCourseEnricher`；C 端 `TrainerCard` 不用 | 中 |
| 载荷字段 | 案例 recent 带全文 `description` | `TrainerCaseServiceImpl.listRecentApproved` | 中 |
| Redis | 已有 `PublicTrainerListCache`（默认列表约 120s） | `PublicTrainerListCache` | 已部分覆盖 |

缺失输入：慢 SQL EXPLAIN、APM 火焰图（实现时按需补）。

### P0 — 立刻瘦身

1. **课程 enrich 按需**  
   - `GET /trainers` 增加 `includeCourse`（默认 `false`）  
   - 默认不调用 `TrainerListItemCourseEnricher`  
   - 培训宝 embed 显式 `includeCourse=true`  
   - `PublicTrainerListCache` key 区分该参数，避免脏缓存

2. **案例 recent 去描述**  
   - `listRecentApproved` 不再填充 `description`（或 DTO 去掉该字段）  
   - UI 只用标题 / 评分

3. **前端并行**  
   - 无 slug 筛选时：默认列表与分类树并行  
   - 有 field / industry / region 时：等树解析后再带参请求  
   - 去掉重复的 `getCachedTrainerIndustryTree()`

4. **推荐拉取**  
   - 与 §2 对齐 `limit=12`

### P1 — 更深后端

1. **缓存**  
   - 巩固默认列表缓存主路径为 `includeCourse=false`  
   - 推荐位 scroller 结果短 TTL（若尚未稳定缓存）  
   - 确认 miss → 写缓存路径可靠

2. **列表 / 推荐 VO 再裁**  
   - 公开列表避免多余空数组与可空长字段  
   - 推荐 VO 列表页仅保留头像 / 姓名 / 头衔所需字段；长文案截断或不返回

3. **索引**  
   - 仅在 EXPLAIN 证明筛选路径缺索引时新增 Flyway `idx_*`  
   - 新脚本跑 `_validate_flyway_migration.py`

4. **RSC 组装**  
   - 优先砍字段体积；`bottomCategoryNav` 已 Suspense，案例 / 推荐拆边界为可选增强

### 不做

- 不伪造精确毫秒承诺  
- 不扩大到全站列表页改造（本变更以专家页为主）

---

## 主要改动面（实现指引）

### 后端

- `CourseServiceImpl` / `VideoServiceImpl` 封面校验（含草稿）
- `TrainerController` / `TrainerService`：`includeCourse` 参数
- `PublicTrainerListCache`：key 纳入 `includeCourse`
- `TrainerCaseServiceImpl.listRecentApproved`：去掉 description
- `TrainerController` recommended 默认 limit 12（如适用）

### C 端 frontend

- `CourseForm` / `VideoForm` 封面必填（含草稿）
- `TrainerRecommendedScroller`：`CARDS_PER_PAGE=4` + 布局
- `trainers/page.tsx` / `loaders.ts` / trainer API：limit 12、并行、`includeCourse` 默认 false；pxb 传 true

### Admin frontend

- 课程 / 录播课创建编辑：封面必填 UI + Zod

---

## 风险与兼容

| 风险 | 缓解 |
|------|------|
| 无封面旧草稿无法再保存 | 产品预期（决策 C）；前端明确提示补封面 |
| Admin 课程创建原先无封面字段 | 补字段后才能创建 |
| `includeCourse` 默认 false 影响 embed | PXB 路径显式传 true；回归培训宝列表 |
| 缓存 key 未区分导致脏数据 | key 必须含 `includeCourse` |
| CMS 推荐位不足 12 条 | 现有 fallback 补齐；运营补 PRIMARY |

---

## 验收清单

- [ ] C 端：公开课 / 内训课 / 录播课，草稿与提交无封面均失败；有封面可成功
- [ ] Admin：课程 / 录播课创建编辑无封面失败
- [ ] 专家页「热门培训领域」一屏 4 人，翻页按 4
- [ ] 「领域推荐专家」仍为 3
- [ ] C 端专家卡 UI 正常；培训宝 embed 仍显示课程标题
- [ ] DevTools：`trainer?_rsc` Content Download 明显下降（对比改前 ~3.27s）

## 校验命令（实现阶段）

```bash
# 后端（在 backend/）
mvn -pl taoke-app -am compile

# 若新增 Flyway 索引
uv run python data-trans/scripts/_validate_flyway_migration.py --version <N>

# C 端
cd frontend && pnpm lint

# Admin
cd admin-frontend && bun lint
```
