# Batch C（SEO/301 尖刀）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 录播对外统一 `/video`、老数字筛选 URL 301 到 `/trainer`、experts/instructors 改永久跳转，堵住 SEO 空筛选与双入口风险。

**Architecture:** 从 `proxy.ts` 抽出可单测的纯函数（数字筛选识别、频道 301 目标）；App Router 别名页改 `permanentRedirect`；站内 SEO 链接改 `ROUTES` 与 `/video/{id}.htm`，不改 `/videos` API。

**Tech Stack:** Next.js 16 `proxy.ts`、vitest、`permanentRedirect`

**Spec:** `docs/superpowers/specs/2026-07-29-opt-batch-c-design.md`

## Global Constraints

- 仅改浏览器 SEO/导航 path；**禁止**改 API：`/videos?...`、`/videos/categories`、publisher 等
- 内部 App 目录保持 `app/.../videos/`，靠 proxy rewrite
- 老数字筛选：**不做** ID→名称臆猜映射，统一 301 → `/trainer`
- CDN / L2 独立 URL / 城市全表 301：不做
- frontend：`pnpm`；测试：`pnpm exec vitest run <file>`

## File map

| 文件 | 职责 |
|------|------|
| Create `frontend/src/lib/seo-legacy-redirects.ts` | 纯函数：是否数字筛选、频道/vedio 详情 301 目标 |
| Create `frontend/src/lib/seo-legacy-redirects.test.ts` | 单测 |
| Modify `frontend/src/proxy.ts` | 调用纯函数，发 301 / 保留 rewrite |
| Modify `frontend/src/config/routes.ts` | `ONLINE_COURSES`/`VIDEOS` → `/video` |
| Modify video/institution/trainer 外链若干 | `/vedio/...` → `/video/...` |
| Modify experts/instructors pages | `permanentRedirect` |

---

### Task 1: seo-legacy-redirects 纯函数 + 单测（TDD）

**Files:**
- Create: `frontend/src/lib/seo-legacy-redirects.ts`
- Create: `frontend/src/lib/seo-legacy-redirects.test.ts`

**Interfaces:**
- Produces:
  - `isLegacyNumericTrainerFilterPath(pathname: string): boolean`
  - `legacyVideoChannelRedirectTarget(pathname: string, search: string): string | null` — `/videos`|`/vedio` → `/video` + search
  - `legacyVedioDetailRedirectTarget(pathname: string): string | null` — `/vedio/123(.htm)` → `/video/123.htm`；play 同理
  - `LEGACY_TRAINER_FILTER_FALLBACK = '/trainer'`

- [ ] **Step 1: 写失败单测**

```ts
import { describe, expect, it } from 'vitest';
import {
  isLegacyNumericTrainerFilterPath,
  legacyVideoChannelRedirectTarget,
  legacyVedioDetailRedirectTarget,
  LEGACY_TRAINER_FILTER_FALLBACK,
} from './seo-legacy-redirects';

describe('isLegacyNumericTrainerFilterPath', () => {
  it('matches multi-segment numeric filter', () => {
    expect(
      isLegacyNumericTrainerFilterPath(
        '/trainer/501/0/0/0/0/0/0/0/0/0/def/0/0/0/0/0/0/0/1.htm',
      ),
    ).toBe(true);
    expect(isLegacyNumericTrainerFilterPath('/trainer/501/0/0/1.htm')).toBe(true);
  });

  it('rejects trainer detail and section and field slug', () => {
    expect(isLegacyNumericTrainerFilterPath('/trainer/123.htm')).toBe(false);
    expect(isLegacyNumericTrainerFilterPath('/trainer/123/courses.htm')).toBe(false);
    expect(isLegacyNumericTrainerFilterPath('/trainer/field=%E7%BB%8F%E8%90%A5.htm')).toBe(false);
    expect(isLegacyNumericTrainerFilterPath('/trainer')).toBe(false);
  });
});

describe('legacyVideoChannelRedirectTarget', () => {
  it('maps /videos and /vedio to /video keeping query', () => {
    expect(legacyVideoChannelRedirectTarget('/videos', '?q=1')).toBe('/video?q=1');
    expect(legacyVideoChannelRedirectTarget('/vedio', '')).toBe('/video');
  });
  it('ignores /video and nested paths', () => {
    expect(legacyVideoChannelRedirectTarget('/video', '')).toBeNull();
    expect(legacyVideoChannelRedirectTarget('/videos/1.htm', '')).toBeNull();
  });
});

describe('legacyVedioDetailRedirectTarget', () => {
  it('maps detail and play', () => {
    expect(legacyVedioDetailRedirectTarget('/vedio/12.htm')).toBe('/video/12.htm');
    expect(legacyVedioDetailRedirectTarget('/vedio/12')).toBe('/video/12.htm');
    expect(legacyVedioDetailRedirectTarget('/vedio/12/play')).toBe('/video/12/play');
  });
});
```

- [ ] **Step 2: 跑测确认失败**

```bash
cd frontend
pnpm exec vitest run src/lib/seo-legacy-redirects.test.ts
```

Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现纯函数**

`isLegacyNumericTrainerFilterPath`：pathname 以 `/trainer/` 开头、以 `.htm` 结尾；去掉前缀与后缀后按 `/` 拆段；第一段为纯数字；总段数 ≥ 2；且**不是**恰好 `[\d+, section]`（section ∈ courses|cases|video|comment|book）。允许中间出现 `def`。

频道/详情函数按单测行为实现。

- [ ] **Step 4: 跑测通过**

```bash
pnpm exec vitest run src/lib/seo-legacy-redirects.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/seo-legacy-redirects.ts frontend/src/lib/seo-legacy-redirects.test.ts
git commit -m "test(frontend): add SEO legacy redirect pure helpers"
```

---

### Task 2: proxy.ts 接入 301

**Files:**
- Modify: `frontend/src/proxy.ts`

- [ ] **Step 1: 在 map 精确匹配与 trainer 循环之前**插入：

1. 若 `isLegacyNumericTrainerFilterPath(pathname)` → `NextResponse.redirect(new URL(LEGACY_TRAINER_FILTER_FALLBACK + search, request.url), 301)`
2. 若 `legacyVideoChannelRedirectTarget(pathname, search)` 非空 → 301
3. 若 `legacyVedioDetailRedirectTarget(pathname)` 非空 → 301（保留 search）

将现有 `course.htm`→`courses.htm` 的 **308 改为 301**（spec 推荐统一）。

保留：`/video` rewrite → locale videos；`/video_play/` 可先保持 rewrite（本批可不改）。

**注意：** `/videos` 精确匹配必须在 `map['/video']` 逻辑之前用 301 处理；不要把 `/videos` 放进 rewrite map。

- [ ] **Step 2: 手测或补充 proxy 集成注释**；再跑 Task1 单测

- [ ] **Step 3: Commit**

```bash
git commit -m "fix(frontend): 301 legacy trainer filter and video channel aliases"
```

---

### Task 3: 站内 SEO 链接统一 `/video`

**Files:**
- Modify: `frontend/src/config/routes.ts` — `ONLINE_COURSES`、`VIDEOS` → `'/video'`；`videoDetail`/`videoPlay` 生成 `/video/...`
- Modify: `frontend/src/features/video/components/list/VideoListSection.tsx` — `navigateToSeoPath('/video')`
- Modify: `frontend/src/features/video/components/list/VideoCard.tsx` — `/video/${id}.htm`
- Modify: `frontend/src/features/institution/components/detail/InstitutionDetailTabs.tsx`、`InstitutionDetailSidebar.tsx`
- Modify: `frontend/src/features/trainer/components/detail/TrainerDetailContent.tsx`
- Modify: `frontend/src/app/not-found-content.tsx` 若硬编码 `/videos`
- Modify: `frontend/src/lib/is-detail-page-path.test.ts` 若断言需对齐

**禁止改：** `features/video/api/*` 里的 `/videos` API 字符串。

- [ ] **Step 1: 改 ROUTES + 外链**
- [ ] **Step 2:** `pnpm exec vitest run src/lib/is-detail-page-path.test.ts src/lib/seo-legacy-redirects.test.ts`
- [ ] **Step 3: Commit**

```bash
git commit -m "fix(frontend): unify online-course SEO paths to /video"
```

---

### Task 4: experts/instructors permanentRedirect

**Files:**
- Modify: `frontend/src/app/[locale]/(public)/experts/page.tsx`
- Modify: `frontend/src/app/[locale]/(public)/instructors/page.tsx`
- Modify: `frontend/src/app/[locale]/(public)/experts/[id]/page.tsx`

```tsx
import { permanentRedirect } from 'next/navigation';
export default function ExpertsRedirect() {
  permanentRedirect('/trainer');
}
```

详情：`permanentRedirect(\`/trainer/${id}.htm\`)`

- [ ] **Step 1: 三处改 permanentRedirect**
- [ ] **Step 2: Commit**

```bash
git commit -m "fix(frontend): permanentRedirect experts and instructors aliases"
```

---

## Spec coverage

| Spec | Task |
|------|------|
| 数字筛选 301 → /trainer | 1+2 |
| /videos /vedio 频道 301 | 1+2 |
| /vedio 详情 301 | 1+2 |
| ROUTES + 卡片 /video | 3 |
| experts 301 | 4 |
| 不改 API /videos | 约束 |
| CDN 等 | 不做 |

## Execution

Plan complete → implement via subagent-driven or inline.
