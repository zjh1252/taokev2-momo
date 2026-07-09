# C 端本地响应时间优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 通过本地摸底定位 C 端慢因，并只修复证据指向的 Top 1–3 热点，使样本页首屏/关键 SSR·API 耗时可对比下降。

**Architecture:** 先对首页、专家列表、专家详情做基线测量并归因；优先消除首页 `load-home-data.ts` 中「列表后再逐条拉详情」的放大延迟；若基线显示列表/详情或单接口是主因，再定点修对应前端瀑布或后端查询。每轮改动前后用同一套样本对比。

**Tech Stack:** Next.js 16 (`frontend` + pnpm)、浏览器 DevTools Network、可选后端 Spring Boot 定点修复

**Spec:** `docs/superpowers/specs/2026-07-09-frontend-local-perf-design.md`

---

## File map

| 文件 | 职责 |
|------|------|
| `docs/superpowers/specs/2026-07-09-frontend-local-perf-baseline.md` | 基线与复测数字、主因标签（新建） |
| `frontend/src/features/home/api/load-home-data.ts` | 首页数据加载；可疑 N+1 详情补全 |
| `frontend/src/app/[locale]/(public)/page.tsx` | 首页 SSR 入口（`Promise.all` 七路并行） |
| `frontend/src/app/[locale]/(public)/trainers/page.tsx` | 专家列表样本页 |
| `frontend/src/app/[locale]/(public)/trainers/[id]/...` | 专家详情样本页（以实际路由为准） |
| 后端对应 Service（仅当归因=`单接口慢`） | 定点 N+1 / 过重查询 |

---

### Task 1: 建立本地基线

**Files:**
- Create: `docs/superpowers/specs/2026-07-09-frontend-local-perf-baseline.md`

- [ ] **Step 1: 确认本地服务就绪**

确保：
- 后端可访问（`NEXT_PUBLIC_API_BASE_URL`，默认 `http://127.0.0.1:8080`）
- C 端：`cd frontend; pnpm dev`

用浏览器打开 `http://localhost:3000/zh-CN`（或项目实际 locale 首页），确认能出内容。

- [ ] **Step 2: 测量三个样本页（尽量冷开或硬刷新，同条件）**

对每个页面记录：

| 页面 | 路径（按实际 locale 调整） | Next 编译/路由就绪 | TTFB / 文档到达 | Top 3 慢 API（URL + 耗时 + 是否串行） |
|------|---------------------------|-------------------|-----------------|--------------------------------------|
| 首页 | `/zh-CN` | | | |
| 专家列表 | `/zh-CN/trainers` | | | |
| 专家详情 | `/zh-CN/trainers/{某个已有 id}` | | | |

测量方法：
1. Chrome DevTools → Network：勾选 Disable cache，硬刷新
2. 看文档请求 Waiting (TTFB)
3. 按 Time 排序，记下最慢的 3 条 XHR/fetch
4. 观察是否「A 结束后才发 B」（瀑布）还是并行

- [ ] **Step 3: 打主因标签并写入基线文件**

创建 `docs/superpowers/specs/2026-07-09-frontend-local-perf-baseline.md`，内容模板：

```markdown
# C 端本地性能基线

- 日期:
- 机器/环境: 本地 `pnpm dev` + API =
- 条件: 冷开 / 硬刷新 / Disable cache

## 样本

### 首页 `/zh-CN`
- 编译/路由就绪: ___ ms
- TTFB: ___ ms
- Top API:
  1. `METHOD path` — ___ ms
  2. ...
- 主因标签: [ ] dev编译 [ ] SSR瀑布 [ ] 单接口慢 [ ] 前端重渲染
- 备注:

### 专家列表 `/zh-CN/trainers`
（同上）

### 专家详情 `/zh-CN/trainers/{id}`
（同上）

## Top 1–3 待修（按影响排序）
1.
2.
3.
```

- [ ] **Step 4: Commit 基线**

```bash
git add docs/superpowers/specs/2026-07-09-frontend-local-perf-baseline.md
git commit -m "docs: record C-end local performance baseline"
```

---

### Task 2: 首页去掉公开课逐条详情补封面（高概率热点）

**前提:** Task 1 基线显示首页 SSR/API 慢，或 Network 中出现多次 `/courses/{id}`（或等价详情路径）。若基线证明首页很快且无详情瀑布，跳过本 Task，在基线文件注明「跳过原因」。

**Files:**
- Modify: `frontend/src/features/home/api/load-home-data.ts`
- Test: 手动 — 首页公开课区块封面仍正常显示

- [ ] **Step 1: 确认列表/运营位已有 coverUrl**

`CourseListItem.coverUrl` 与运营位 `mapSlotCoursesToPublicCourses` 已带封面。`enrichPublicCourseCovers` 对每门课再调 `getCourseDetail` 仅为主页 3 门公开课对齐详情封面，代价是额外 N 次详情请求。

- [ ] **Step 2: 删除 `enrichPublicCourseCovers` 及其调用**

在 `load-home-data.ts`：

1. 删除整个 `enrichPublicCourseCovers` 函数（约 L100–115）
2. 若 `getCourseDetail` 不再被本文件使用，从顶部 import 中移除
3. 修改 `loadHomePublicCourses`：直接返回 mapped / legacy 结果，不再 `enrichPublicCourseCovers(...)`

目标形态：

```typescript
export async function loadHomePublicCourses(): Promise<PublicCourse[]> {
  try {
    const slotItems = await getPublicRecommendations(RecommendationSlotCode.HOME_OPEN_COURSE, {
      limit: 3
    });
    if (slotItems.length > 0) {
      return mapSlotCoursesToPublicCourses(slotItems, (value) =>
        formatPlanStartDate(value ?? undefined)
      );
    }
    return await loadHomePublicCoursesLegacy();
  } catch {
    try {
      return await loadHomePublicCoursesLegacy();
    } catch {
      return [];
    }
  }
}
```

`loadHomePublicCoursesLegacy` 已用 `resolveApiImageSrc(c.coverUrl)`，无需再拉详情。

- [ ] **Step 3: 手动验证**

1. 硬刷新首页
2. Network 中不应再出现「仅为首页公开课封面」的批量课程详情请求
3. 公开课区块仍有封面（允许与详情页封面在极端数据下略有差异；列表 cover 为空时卡片可无图）

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/home/api/load-home-data.ts
git commit -m "perf(home): stop fetching course details only for cover URLs"
```

---

### Task 3: 收敛首页专家详情补全请求

**前提:** Task 1 显示首页有多次 trainer detail 请求，或 `loadHomeExperts` 路径明显偏慢。否则跳过并注明。

**Files:**
- Modify: `frontend/src/features/home/api/load-home-data.ts`

当前问题：
- `mapTrainersToExperts` 对前 2 人调 `getTrainerDetail`
- `enrichExpertsFromApi` 对最终最多 4 名专家再各调一次 `getTrainerDetail`
- 最坏约 4–6 次详情请求，且许多字段列表项已有（`avatar`、`oneLineIntro`、`title` 等）

- [ ] **Step 1: 让 `enrichExpertsFromApi` 仅在缺关键展示字段时请求详情**

将「无条件全量详情」改为「缺 avatar/cover/bio 才拉详情」：

```typescript
async function enrichExpertsFromApi(experts: Expert[]): Promise<Expert[]> {
  return Promise.all(
    experts.map(async (expert) => {
      if (!expert.id) return expert;

      const needsDetail =
        !expert.avatar?.trim() ||
        !expert.coverImage?.trim() ||
        !expert.bio?.trim();

      if (!needsDetail) {
        return {
          ...expert,
          avatar: resolveApiImageSrc(expert.avatar),
          coverImage: resolveApiImageSrc(expert.coverImage || expert.avatar)
        };
      }

      try {
        const detail = await getTrainerDetail(expert.id);
        const avatarRaw = detail.avatar?.trim();
        const coverRaw = detail.backgroundImage?.trim() || avatarRaw;
        return {
          ...expert,
          name: detail.teachingName || detail.name || expert.name,
          title: toPlainIntroText(detail.title || expert.title),
          avatar: avatarRaw ? resolveApiImageSrc(avatarRaw) : resolveApiImageSrc(expert.avatar),
          coverImage: coverRaw
            ? resolveApiImageSrc(coverRaw)
            : resolveApiImageSrc(expert.coverImage || expert.avatar),
          bio: toPlainIntroText(detail.intro || detail.bio || expert.bio),
          subtitle: toPlainIntroText(detail.oneLineIntro || expert.subtitle)
        };
      } catch {
        return {
          ...expert,
          avatar: resolveApiImageSrc(expert.avatar),
          coverImage: resolveApiImageSrc(expert.coverImage || expert.avatar)
        };
      }
    })
  );
}
```

- [ ] **Step 2: 去掉 `mapTrainersToExperts` 内的预拉详情（避免与 enrich 重复）**

```typescript
async function mapTrainersToExperts(trainers: TrainerListItem[]): Promise<Expert[]> {
  if (trainers.length === 0) return [];
  return trainers.map((t, index) => mapTrainerListItemToExpert(t, index, null));
}
```

列表字段足够支撑首页卡片；若仍缺字段，由 Step 1 的按需详情补齐。

- [ ] **Step 3: 手动验证**

1. 硬刷新首页，专家区块头像/简介正常
2. Network 中 trainer detail 次数应明显少于改前（理想：运营位/列表字段齐全时为 0）

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/home/api/load-home-data.ts
git commit -m "perf(home): fetch trainer details only when list fields are missing"
```

---

### Task 4: 按基线处理列表/详情或单接口慢（条件任务）

**前提:** 打开 Task 1 的「Top 1–3 待修」。若 Top 项已被 Task 2/3 覆盖，本 Task 只做复测记录。若仍有列表/详情 SSR 瀑布或单接口慢，按下列分支之一执行（只做证据指向的那条，不要三条全做）。

**Files（按归因选择）:**
- 列表 SSR: `frontend/src/app/[locale]/(public)/trainers/page.tsx` 及相关 `lib/cached-categories` / feature server loaders
- 详情 SSR: 专家详情 page + `frontend/src/features/trainer/api/server.ts`（已有 `getTrainerDetailCached`）
- 单接口慢: 对应 `backend/taoke-*/**/*Service*.java`（禁止无证据大改）

- [ ] **Step 1: 写清本轮唯一改动点**

在基线文件追加：

```markdown
## Task 4 选定改动
- 样本页:
- 证据（API/瀑布描述）:
- 改动文件:
- 预期效果:
```

- [ ] **Step 2A — 若主因是前端 SSR 瀑布**

检查该 page 是否存在「先 await A 再 await B」；改为尽早启动独立 Promise，再 `Promise.all`（参考首页 `page.tsx` 已有模式）。不要引入新依赖。

示例模式：

```typescript
const listPromise = getTrainerList(params);
const treePromise = getCachedTrainerExpertiseTree();
const [list, tree] = await Promise.all([listPromise, treePromise]);
```

- [ ] **Step 2B — 若主因是单接口慢**

1. 在后端对应 Service 查循环内懒加载 / 缺批量查询
2. 按仓库规范改为分步批量或 DTO 投影（参考 `TrainerServiceImpl` 分步加载注释）
3. **不要**运行全量无关 `mvn`；需要时仅 `cd backend; mvn -pl taoke-app -am compile` 自检
4. 用同一 API 路径在 Network 复测耗时

- [ ] **Step 2C — 若主因几乎全是 `dev 编译`**

不要大改业务。可选轻量尝试（单独小提交，可回滚）：

在 `frontend/package.json` 将 `"dev": "next dev --webpack"` 临时改为 `"dev": "next dev --turbopack"`（或 Next 16 等价），冷开首页对比编译时间。若不稳定/报错，立即改回 webpack 并在基线注明「Turbopack 不适用」。

- [ ] **Step 3: Commit（仅当有代码改动）**

```bash
git add <changed-files>
git commit -m "perf: fix measured bottleneck on <page-or-api>"
```

---

### Task 5: 复测、验收与收口

**Files:**
- Modify: `docs/superpowers/specs/2026-07-09-frontend-local-perf-baseline.md`

- [ ] **Step 1: 同条件复测三个样本页**

在基线文件追加「复测」表，字段与基线相同，并写前后对比：

```markdown
## 复测（改后）

### 首页
- TTFB: ___ ms（基线 ___ → 复测 ___，Δ ___）
- Top API 变化:
- 功能检查: [ ] 轮播 [ ] 专家 [ ] 案例 [ ] 内训课 [ ] 公开课 [ ] 城市频道
```

- [ ] **Step 2: 验收清单**

- [ ] 至少 1 个样本页有可解释的耗时下降，或已证明主因是 `dev 编译` 并记录可选后续
- [ ] 每条代码优化能对应基线证据
- [ ] 样本页无功能回归

- [ ] **Step 3: Commit 复测结果**

```bash
git add docs/superpowers/specs/2026-07-09-frontend-local-perf-baseline.md
git commit -m "docs: record C-end local performance retest results"
```

---

## Spec coverage (self-review)

| Spec 要求 | 对应 Task |
|-----------|-----------|
| 固定三样本 + 三类时间 + 主因标签 | Task 1 |
| 先摸底再修 Top 1–3 | Task 1 → 2/3/4 |
| 去掉列表后再逐条详情 | Task 2、Task 3 |
| 并行 / Suspense / 后端定点 | Task 4 分支 |
| `next dev` 不误当业务问题 | Task 4C + Task 5 |
| 改前改后数字验收 | Task 5 |

无 TBD/占位；Task 4 为条件分支但每条都有具体文件与做法。
