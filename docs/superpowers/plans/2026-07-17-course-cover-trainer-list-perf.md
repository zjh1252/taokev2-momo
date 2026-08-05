# 课程封面必填 + 专家页四人一组 + 专家页性能优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 公开课/内训课/录播课封面在 C 端与 Admin（含草稿）一律必填；专家页「热门培训领域」改为四人一组；压低专家页 RSC Content Download（目标从 ~3s 量级降到亚秒～1s，预估需压测复核）。

**Architecture:** 后端 service 层统一强制 `coverUrl`（权威校验）；前端表单对齐提示。推荐横滑仅改 `CARDS_PER_PAGE` 与拉取 limit=12。列表 API 默认跳过课程 enrich（`includeCourse=false`），培训宝显式开启；案例 recent 去掉 description；SSR 无筛选时列表与分类树并行；缓存 key 区分 `includeCourse`。

**Tech Stack:** Java 21 / Spring Boot 3.5 / JPA、Next.js 16（frontend pnpm + admin-frontend bun）、Redis（`PublicTrainerListCache`）

**Spec:** `docs/superpowers/specs/2026-07-17-course-cover-trainer-list-perf-design.md`

## Global Constraints

- 注释中文；JavaDoc `@author Fangxinxin` + `@date yyyy-MM-dd HH:mm`
- 禁止循环依赖；跨模块只走 `api/`
- 不改「领域推荐专家」人数（保持 3）
- 不强制 Flyway 回填历史无封面数据
- 包管理：frontend=pnpm，admin-frontend=bun；后端编译在 `backend/` 用模块范围 Maven
- 每项任务完成后单独 commit（若用户未禁止）

---

## File map

| 文件 | 职责 |
|------|------|
| `backend/.../CourseServiceImpl.java` | 草稿也校验封面 |
| `backend/.../video/VideoServiceImpl.java` | 草稿+提交校验封面 |
| `frontend/.../CourseForm.tsx` | 草稿也校验封面 |
| `frontend/.../VideoForm.tsx` | 封面必填（草稿/提交） |
| `admin-frontend/.../course-create-form.tsx` | 占位表单补封面必填字段 |
| `admin-frontend/.../video-create-form.tsx` | Zod `coverUrl` 必填 |
| `TrainerRecommendedScroller.tsx` | `CARDS_PER_PAGE=4` + 卡宽 |
| `trainers/page.tsx` / `loaders.ts` / trainer `service.ts` | limit 12、并行、`includeCourse` |
| `TrainerController` / `TrainerService` / `TrainerServiceImpl` | `includeCourse` 参数 |
| `PublicTrainerListCache.java` | cache key 含 `includeCourse` |
| `TrainerCaseServiceImpl.java` | recent 不填 description |
| `TrainerCaseRecentResponse`（若需） | 可选去掉 description 字段 |

---

### Task 1: 后端课程/录播课封面含草稿必填

**Files:**
- Modify: `backend/taoke-course/src/main/java/com/taoke/course/service/CourseServiceImpl.java`（`create` / `update`）
- Modify: `backend/taoke-course/src/main/java/com/taoke/course/service/video/VideoServiceImpl.java`（`create` / `update` / `validateForSubmit`）
- Test（可选但推荐）: 在 `backend/taoke-course/src/test/java/...` 增加聚焦校验的单测，或手工用接口验证

**Interfaces:**
- Consumes: `SaveCourseRequest.getCoverUrl()` / `SaveVideoRequest.getCoverUrl()` / `getDraft()`
- Produces: 空白封面时 `BusinessException(ErrorCode.PARAM_INVALID, "请上传课程封面")`（录播课可用同一文案）

- [ ] **Step 1: 抽出课程封面校验并在 create/update 始终调用**

在 `CourseServiceImpl` 增加私有方法：

```java
/** 封面必填（含草稿） */
private void validateCoverRequired(SaveCourseRequest request) {
    if (request.getCoverUrl() == null || request.getCoverUrl().isBlank()) {
        throw new BusinessException(ErrorCode.PARAM_INVALID, "请上传课程封面");
    }
}
```

在 `create` / `update` 中，**无论 draft**，先调用 `validateCoverRequired(request)`。  
保留 `validateForSubmit` 内封面检查（或改为调用同一方法），避免提交路径漏检。

- [ ] **Step 2: 录播课同样强制封面**

在 `VideoServiceImpl`：

```java
private void validateCoverRequired(SaveVideoRequest request) {
    if (request.getCoverUrl() == null || request.getCoverUrl().isBlank()) {
        throw new BusinessException(ErrorCode.PARAM_INVALID, "请上传课程封面");
    }
}
```

在 `create` / `update`（及任何走保存的入口）无论 draft 都调用。  
在 `validateForSubmit` 中也调用一次（或合并）。

- [ ] **Step 3: 编译自检**

Run（在 `backend/`）:

```bash
mvn -pl taoke-course -am compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add backend/taoke-course/src/main/java/com/taoke/course/service/CourseServiceImpl.java \
  backend/taoke-course/src/main/java/com/taoke/course/service/video/VideoServiceImpl.java
git commit -m "$(cat <<'EOF'
fix: require course and video cover on draft save

EOF
)"
```

---

### Task 2: C 端 CourseForm / VideoForm 封面含草稿必填

**Files:**
- Modify: `frontend/src/features/course/components/publisher/CourseForm.tsx`
- Modify: `frontend/src/features/video/components/publisher/VideoForm.tsx`
- Modify（如有文案键）: `frontend/src/messages/zh-CN/course.json`（仅当改 i18n 时）

**Interfaces:**
- Consumes: Task 1 后端错误文案「请上传课程封面」
- Produces: 前端草稿/提交均在无 `coverUrl` 时 toast 拦截，不发请求

- [ ] **Step 1: CourseForm — 草稿也校验封面**

将 `submitForm` 中封面校验移出 `if (!draft)`，改为始终执行：

```tsx
if (!coverUrl.trim()) {
  fail('请上传课程封面', 'cover');
  return;
}
```

更新注释：草稿也要求封面。

- [ ] **Step 2: VideoForm — 草稿/提交均校验封面**

在 `submitForm` 中（`draft` 分支内外均执行）：

```tsx
if (!coverUrl.trim()) {
  // 与现有 fail/toast 模式一致
  toast.error('请上传课程封面'); // 或项目现有 fail() 辅助
  return;
}
```

封面 UI 标签加必填标记（与 CourseForm `required` 一致）。自动截帧写入 `coverUrl` 后视为已填。

- [ ] **Step 3: 手工验收**

- 公开课/内训课：无封面点「保存草稿」→ 前端拦截
- 录播课：无封面点草稿/提交 → 前端拦截
- 有封面可正常保存

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/course/components/publisher/CourseForm.tsx \
  frontend/src/features/video/components/publisher/VideoForm.tsx
git commit -m "$(cat <<'EOF'
fix: require cover on C-end course and video drafts

EOF
)"
```

---

### Task 3: Admin 课程/录播课封面必填

**Files:**
- Modify: `admin-frontend/src/features/courses/components/course-create-form.tsx`
- Modify: `admin-frontend/src/features/videos/components/video-create-form.tsx`
- 若有编辑表单含 `coverUrl`，同步必填（当前主要是 create；detail 只读则不动）

**Interfaces:**
- Produces: Zod `coverUrl: z.string().min(1, '请上传课程封面')`；表单展示必填封面字段

- [ ] **Step 1: course-create-form 补封面字段**

```ts
const formSchema = z.object({
  title: z.string().min(1, '请输入课程名称'),
  type: z.enum(['INTERNAL', 'OPEN_OFFLINE', 'OPEN_ONLINE']),
  coverUrl: z.string().min(1, '请上传课程封面'),
});
```

`defaultValues` 增加 `coverUrl: ''`；UI 增加封面 URL 输入（或项目已有 ImageUploader 则复用）。占位 toast 提交前 Zod 已拦截空封面。

- [ ] **Step 2: video-create-form 改必填**

```ts
coverUrl: z.string().min(1, '请上传课程封面'),
```

确认表单已有封面输入控件；label 标 `required`。

- [ ] **Step 3: lint**

```bash
cd admin-frontend
bun lint
```

Expected: 无新增错误

- [ ] **Step 4: Commit**

```bash
git add admin-frontend/src/features/courses/components/course-create-form.tsx \
  admin-frontend/src/features/videos/components/video-create-form.tsx
git commit -m "$(cat <<'EOF'
fix: require coverUrl in admin course and video forms

EOF
)"
```

---

### Task 4: 「热门培训领域」四人一组

**Files:**
- Modify: `frontend/src/features/trainer/components/list/TrainerRecommendedScroller.tsx`
- Modify: `frontend/src/app/[locale]/(public)/trainers/page.tsx`
- Modify: `frontend/src/features/recommendation/api/loaders.ts`
- Modify: `frontend/src/features/trainer/api/service.ts`（默认 limit）
- Modify: `backend/taoke-user/.../TrainerController.java`（`/trainers/recommended` default 12）

**Interfaces:**
- Produces: `CARDS_PER_PAGE = 4`；SSR/client 拉取 12 条；后端 recommended 默认 12

- [ ] **Step 1: 改 scroller 常量与布局**

```tsx
const CARDS_PER_PAGE = 4;
```

容器与卡宽（在现有 `max-w-[721px]` / `w-[227px]` 基础上）：

- 单卡宽改为约 `165px`（4×165 + 3×20 gap ≈ 720），或略增容器宽度使 4 卡完整露出
- 更新注释「一组 = 4 张」
- `getTopRecommendedTrainers(12)`；SSR 不足一页判断用 `CARDS_PER_PAGE`

- [ ] **Step 2: page / loaders / API 默认 12**

- `loadTrainerListRecommended(12)`
- `loaders.ts` 默认 `limit = 12`
- `getTopRecommendedTrainers(limit = 12)`
- `TrainerController.recommendedForTop`：`defaultValue = "12"`

- [ ] **Step 3: 浏览器验收**

打开 `/trainer`：首屏「热门培训领域」完整 4 人大卡，无半卡；滑动步进为 4。

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/trainer/components/list/TrainerRecommendedScroller.tsx \
  frontend/src/app/[locale]/\(public\)/trainers/page.tsx \
  frontend/src/features/recommendation/api/loaders.ts \
  frontend/src/features/trainer/api/service.ts \
  backend/taoke-user/src/main/java/com/taoke/user/controller/TrainerController.java
git commit -m "$(cat <<'EOF'
feat: show four trainers per recommended scroller page

EOF
)"
```

---

### Task 5: `includeCourse` 按需 enrich + 缓存 key

**Files:**
- Modify: `backend/taoke-user/src/main/java/com/taoke/user/api/TrainerService.java`
- Modify: `backend/taoke-user/src/main/java/com/taoke/user/service/TrainerServiceImpl.java`
- Modify: `backend/taoke-user/src/main/java/com/taoke/user/controller/TrainerController.java`
- Modify: `backend/taoke-user/src/main/java/com/taoke/user/support/PublicTrainerListCache.java`
- Modify: `frontend/src/features/trainer/api/service.ts`
- Modify: `frontend/src/features/trainer/types.ts`（`TrainerListParams` 加 `includeCourse?: boolean`）
- Modify: `frontend/src/features/trainer/components/pxb/pxb-trainer-list-url.ts` 或 `PxbTrainerListSection` 调用处传 `includeCourse: true`

**Interfaces:**
- Consumes: 现有 `TrainerListItemEnricher.enrich`
- Produces: `listPublic(..., boolean includeCourse)`；默认 `false`；缓存 key 含 `c0`/`c1`

- [ ] **Step 1: 扩展缓存 key**

```java
private static String listKey(String sort, int page, int size, boolean includeCourse) {
    String s = sort.isEmpty() ? "default" : sort;
    return LIST_KEY_PREFIX + s + ":p" + page + ":s" + size + ":c" + (includeCourse ? "1" : "0");
}
```

更新 `getDefaultList` / `putDefaultList` / `evictPublicListCaches` 遍历两种 `includeCourse`。

- [ ] **Step 2: Service / Controller 传参**

```java
// TrainerController
@RequestParam(required = false, defaultValue = "false") boolean includeCourse

// TrainerServiceImpl.listPublic — 签名末尾增加 boolean includeCourse
if (includeCourse) {
    trainerListItemEnricher.ifPresent(enricher -> enricher.enrich(items));
}
```

缓存读写全部带上 `includeCourse`。

- [ ] **Step 3: 前端**

`getTrainerList`：若 `params.includeCourse === true` 则 `query.set('includeCourse', 'true')`。  
C 端默认不传（后端 false）。  
PXB：`pxbTrainerListParams` 或 `getTrainerList` 调用处设 `includeCourse: true`。

- [ ] **Step 4: 编译**

```bash
cd backend
mvn -pl taoke-user,taoke-app -am compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 5: Commit**

```bash
git add backend/taoke-user/src/main/java/com/taoke/user/api/TrainerService.java \
  backend/taoke-user/src/main/java/com/taoke/user/service/TrainerServiceImpl.java \
  backend/taoke-user/src/main/java/com/taoke/user/controller/TrainerController.java \
  backend/taoke-user/src/main/java/com/taoke/user/support/PublicTrainerListCache.java \
  frontend/src/features/trainer/api/service.ts \
  frontend/src/features/trainer/types.ts \
  frontend/src/features/trainer/components/pxb/
git commit -m "$(cat <<'EOF'
perf: skip trainer list course enrich unless includeCourse

EOF
)"
```

---

### Task 6: 案例 recent 去 description + SSR 并行

**Files:**
- Modify: `backend/taoke-user/src/main/java/com/taoke/user/service/TrainerCaseServiceImpl.java`
- Modify（可选）: `backend/taoke-user/.../dto/trainercase/TrainerCaseRecentResponse.java` — 删除 `description` 字段若无其它消费者
- Modify: `frontend/src/app/[locale]/(public)/trainers/page.tsx`
- Modify: `frontend/src/features/trainer/api/service.ts`（`RecentTrainerCase` 类型可去掉 description）

**Interfaces:**
- Produces: recent 响应无长文本；无 slug 筛选时列表请求与树并行

- [ ] **Step 1: 去掉 recent description**

删除或注释：

```java
// r.setDescription(c.getDescription());
```

若前端类型有 `description`，改为可选或删除，避免误用。

- [ ] **Step 2: SSR 并行重构**

在 `trainers/page.tsx`：

- `hasSlugFilters = Boolean(slugParams.field || slugParams.industry || slugParams.region || …)`（与 `slugParamsToTrainerListParams` 实际依赖一致）
- **无筛选**：`getTrainerList({ page, size: 16, sort: 'default' })` 与两棵树 `Promise.all` 并行
- **有筛选**：等树解析后 `slugParamsToTrainerListParams` 再请求
- 去掉第二次多余的 `getCachedTrainerIndustryTree()`
- 推荐 limit 已在 Task 4 改为 12

示意：

```tsx
const defaultListPromise = getTrainerList({
  page: listPage,
  size: 16,
  sort: 'default',
}).catch(() => emptyPage(listPage));

const listPromise = needsTreeForFilters
  ? Promise.all([expertiseTreePromise, industryTreePromise]).then(([expertiseTree, industryTree]) =>
      getTrainerList(slugParamsToTrainerListParams(...)).catch(() => emptyPage(listPage)),
    )
  : defaultListPromise;
```

- [ ] **Step 3: DevTools 对比**

刷新 `/trainer`，记录 `trainer?_rsc` Content Download，对比改前 ~3.27s（预估应明显下降）。

- [ ] **Step 4: Commit**

```bash
git add backend/taoke-user/src/main/java/com/taoke/user/service/TrainerCaseServiceImpl.java \
  frontend/src/app/[locale]/\(public\)/trainers/page.tsx \
  frontend/src/features/trainer/api/service.ts
git commit -m "$(cat <<'EOF'
perf: trim trainer page RSC payload and parallelize fetches

EOF
)"
```

---

### Task 7: P1 收尾验收（缓存确认 / 有证据再加索引）

**Files:**
- 按需 Modify: 推荐位缓存（若 `PublicRecommendationServiceImpl` 已有 Redis 则确认 TTL 与 limit=12 命中）
- 按需 Create: `backend/taoke-app/src/main/resources/db/migration/V{N}__add_idx_*.sql`（**仅当** EXPLAIN 证明缺索引）

- [ ] **Step 1: 确认推荐位缓存**

阅读 `PublicRecommendationServiceImpl.listPublic`：已有 cache 则无需新键；确认 `TRAINER_LIST_TRAINER` + limit=12 可命中。若完全无缓存且列表页仍慢，再补短 TTL（≤120s）缓存，键含 `slotCode/categoryId/limit`。

- [ ] **Step 2: 索引门禁**

无慢 SQL / EXPLAIN 证据则 **跳过** Flyway。有证据时：

```bash
uv run python data-trans/scripts/_validate_flyway_migration.py --version <N>
```

- [ ] **Step 3: 全量验收清单（对照 spec）**

- [ ] C 端公开课/内训课/录播课：无封面草稿与提交均失败
- [ ] Admin 课程/录播课：无封面无法提交
- [ ] 「热门培训领域」一屏 4 人；「领域推荐专家」仍 3
- [ ] C 端专家卡正常；PXB embed 仍有课程标题（`includeCourse=true`）
- [ ] `trainer?_rsc` Content Download 明显下降

- [ ] **Step 4: 最终 commit（仅当本任务有代码改动）**

```bash
git add -A  # 仅本任务相关文件
git commit -m "$(cat <<'EOF'
perf: finalize trainer list P1 cache and verification notes

EOF
)"
```

---

## Spec coverage check

| Spec 要求 | Task |
|-----------|------|
| 封面 C 端+Admin 含草稿必填 | 1, 2, 3 |
| 热门培训领域 4 人一组 | 4 |
| includeCourse / 跳过 enrich | 5 |
| 案例去 description | 6 |
| SSR 并行 | 6 |
| 缓存 key / 推荐缓存 / 索引门禁 | 5, 7 |
| 不改领域推荐专家 | 全局约束（无任务改动） |

## Placeholder scan

无 TBD /「类似 Task N」占位；索引任务明确「无证据则跳过」。
