# C 端待优化记录 Batch A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 落实 `docs/tmp/待优化记录.pdf` Batch A（条目 3/5/6/9/10–14）的 C 端体验修补。

**Architecture:** 仅改 `frontend/` 现有组件，点状修补、不抽共享抽象、不改后端契约。筛选关浮层、大卡 flex 铺满、顶栏外链、专家 Tab 滚动降级方案、Video.js 中文与播放页分类/布局微调。

**Tech Stack:** Next.js 16、React 19、Tailwind CSS、video.js、vitest（`pnpm test`）、next-intl

**Spec:** `docs/superpowers/specs/2026-07-28-frontend-opt-batch-a-design.md`

## Global Constraints

- 范围仅 `frontend/`；不做 301/SEO、客服弹窗、登录协议、Win11 全局 rem、图片必填、性能优化
- 专家详情 **不** 改为单页 scroll-spy；保留路由 Tab + SEO URL
- UI「常驻城市」文案可改；接口参数 `region` / `provinceId` 不变
- 包管理只用 `pnpm`（frontend）
- 用户未明确要求时不要擅自 `git commit`（计划中的 commit 步骤仅在用户授权后执行）

## File Map

| 文件 | 职责 |
|------|------|
| `frontend/src/features/trainer/components/list/TrainerFilters.tsx` | #3 点选关浮层；#6 标签「常驻城市」 |
| `frontend/src/messages/zh-CN/trainer.json` | #6 i18n `filters.city` |
| `frontend/src/features/home/components/ExpertsSection.tsx` | #5 大卡 bio 铺满 |
| `frontend/src/components/layout/top-nav-bar.tsx` | #9 产品外链 |
| `frontend/src/features/trainer/components/detail/TrainerDetailContent.tsx` | #10/#11 滚动 |
| `frontend/src/features/video/components/player/VideoJsPlayer.tsx` | #12 中文语言 |
| `frontend/src/features/video/components/player/video-player.css` | #12 控件位置/文案兜底（如需） |
| `frontend/src/features/video/components/play/VideoPlayPageContent.tsx` | #13 布局；#14 分类 |
| `frontend/src/features/video/utils/category-tags.ts` | #14 纯函数构建分类标签 |
| `frontend/src/features/video/utils/category-tags.test.ts` | #14 单测 |

**说明：** `OpenCourseFilters` 多选刻意不关浮层（连续多选）；`InnerCourseFilters` 已 `closeFlyout()`。本批 #3 以专家侧栏为主。

---

### Task 1: 专家筛选点选关浮层 + 常驻城市文案（#3、#6）

**Files:**
- Modify: `frontend/src/features/trainer/components/list/TrainerFilters.tsx`
- Modify: `frontend/src/messages/zh-CN/trainer.json`

**Interfaces:**
- Consumes: 现有 `onChange` / `TrainerFilterValue`
- Produces: 点选后浮层关闭；label 文案「常驻城市」

- [ ] **Step 1: 改 i18n 文案**

将 `frontend/src/messages/zh-CN/trainer.json` 中：

```json
"city": "常驻省市"
```

改为：

```json
"city": "常驻城市"
```

- [ ] **Step 2: TrainerFilters 标签与关浮层**

1. `FILTER_ITEMS` 中 province 的 `label: '长驻省市'` 改为 `label: '常驻城市'`。
2. 注释/JSDoc 中「长驻省市」同步改为「常驻城市」（参数名不动）。
3. 在三个 handler 末尾关闭浮层：

```tsx
const closeFlyout = () => setActiveFilter(null);

const handleExpertisePick = (parentName?: string, childName?: string, categoryId?: number) => {
  onChange({
    ...value,
    fieldParentName: parentName,
    fieldChildName: childName,
    expertiseCategoryId: categoryId,
  });
  closeFlyout();
};

const handleIndustryPick = (name?: string, categoryId?: number) => {
  onChange({ ...value, industryName: name, industryCategoryId: categoryId });
  closeFlyout();
};

const handleProvincePick = (item?: RegionItem) => {
  onChange({ ...value, regionName: item?.name, provinceId: item?.id });
  closeFlyout();
};
```

- [ ] **Step 3: 手工验收**

Run: `cd frontend && pnpm lint`  
Expected: 无新增 error  

浏览器：打开专家列表 → hover 擅长领域 → 点任意选项 → 列表更新且浮层立即消失；侧栏文案为「常驻城市」。

- [ ] **Step 4: Commit（仅当用户授权）**

```bash
git add frontend/src/features/trainer/components/list/TrainerFilters.tsx frontend/src/messages/zh-CN/trainer.json
git commit -m "$(cat <<'EOF'
fix(frontend): 专家筛选点选关浮层并统一常驻城市文案

EOF
)"
```

---

### Task 2: 首页专家大卡简介铺满（#5）

**Files:**
- Modify: `frontend/src/features/home/components/ExpertsSection.tsx`（`MainExpertCard`）

**Interfaces:**
- Consumes: `getExpertCardCopy(expert)`
- Produces: bio 在标签上方占满可用垂直空间

- [ ] **Step 1: 调整 MainExpertCard 文本区布局**

将右侧文案区中 bio 与底部操作区改为：

```tsx
<div className="md:w-[55%] p-6 lg:p-8 flex flex-col flex-1 relative z-20 min-h-0">
  <h3 className="text-3xl font-black mb-2 text-slate-800 truncate">
    {expert.name}
    {copy.title ? (
      <span className="text-lg font-normal text-slate-500 ml-2">{copy.title}</span>
    ) : null}
  </h3>
  {copy.subtitle ? (
    <p className="text-primary text-sm font-bold mb-3 line-clamp-2">{copy.subtitle}</p>
  ) : null}
  {copy.bio ? (
    <p className="text-slate-500 text-sm mb-4 leading-relaxed flex-1 min-h-0 overflow-hidden">
      {copy.bio}
    </p>
  ) : null}
  <div className="mt-auto flex flex-col gap-4 pt-2 shrink-0">
    <ExpertTagList
      tags={expert.tags}
      limit={4}
      tagClassName="bg-slate-100 text-slate-600 px-3 py-1 rounded text-xs font-medium"
    />
    <span className="bg-primary text-white px-6 py-3 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 w-full shadow-sm">
      查看专家详情
    </span>
  </div>
</div>
```

要点：去掉 bio 的 `line-clamp-6`；bio 加 `flex-1`；标签区 `shrink-0` + `mt-auto`。模块外层 `md:h-[500px]` **不要改**。

- [ ] **Step 2: 手工验收**

浏览器首页推荐专家：大卡简介铺满姓名/副标题与标签之间的空白；中卡/小卡不动。

- [ ] **Step 3: Commit（仅当用户授权）**

```bash
git add frontend/src/features/home/components/ExpertsSection.tsx
git commit -m "$(cat <<'EOF'
fix(frontend): 首页推荐专家大卡简介铺满可用高度

EOF
)"
```

---

### Task 3: 顶栏产品矩阵外链（#9）

**Files:**
- Modify: `frontend/src/components/layout/top-nav-bar.tsx`

**Interfaces:**
- Produces: `GROUP_LINKS` 六项外链，无「淘课网」

- [ ] **Step 1: 更新 GROUP_LINKS 与锚点属性**

替换为：

```tsx
const GROUP_LINKS = [
  { label: '淘课集团', href: 'https://www.taoke.com.cn/' },
  { label: '培训宝', href: 'https://www.91pxb.com/' },
  { label: '目标通', href: 'https://www.91mbt.com/' },
  { label: 'AI 导师', href: 'https://a23880.91pxb.com/pc_elearning/#/ai/mentor/604996/list' },
  { label: '智能创导', href: 'https://a23880.91pxb.com/pc_elearning/#/ai/extraction/604996' },
  { label: 'AI 陪练', href: 'https://a23880.91pxb.com/pc_elearning/#/ai/training_partner/604996/list' },
] as const;
```

`<a>` 增加：

```tsx
<a
  href={link.href}
  target="_blank"
  rel="noopener noreferrer"
  className="hover:text-primary transition-colors"
>
  {link.label}
</a>
```

确认已删除「淘课网」项。

- [ ] **Step 2: 手工验收**

顶栏六项均可新标签打开；无「淘课网」。

- [ ] **Step 3: Commit（仅当用户授权）**

```bash
git add frontend/src/components/layout/top-nav-bar.tsx
git commit -m "$(cat <<'EOF'
fix(frontend): 配置顶栏集团产品外链并移除淘课网入口

EOF
)"
```

---

### Task 4: 专家详情 Tab / 评价滚动（#10、#11）

**Files:**
- Modify: `frontend/src/features/trainer/components/detail/TrainerDetailContent.tsx`
- Modify: `frontend/src/features/trainer/components/detail/TrainerDetailPageView.tsx`（若内容滚动锚点更适合挂在外层）

**Interfaces:**
- Consumes: `activeTab: TrainerTabId`、现有 `getTrainerDetailTabHref`
- Produces: 内容区 `scroll-margin-top`；评价 Tab 将「我要评价」滚到视口中线附近

- [ ] **Step 1: 内容区增加滚动锚点**

在 `TrainerDetailContent` 根内容容器（`min-h-[800px]` 那层）加：

```tsx
id="trainer-detail-tab-panel"
className="min-h-[800px] scroll-mt-[120px]"
```

`120px` 需覆盖 sticky 顶栏 + Tab 条高度；若实测遮挡，可调到 `140`/`160`。

- [ ] **Step 2: Tab 切换后滚到内容区顶部**

在 `TrainerDetailContent`（`'use client'`）内：

```tsx
useEffect(() => {
  const el = document.getElementById('trainer-detail-tab-panel');
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}, [activeTab]);
```

保留现有 `Link` + SEO URL + 下划线选中，**不要**改成单页堆模块。

- [ ] **Step 3: 评价 Tab 将「我要评价」滚到视口中线**

1. 给「我要评价」按钮加 `ref` 或 `id="trainer-review-cta"`。
2. 在 `ReviewsView` 挂载且 `activeTab === 'comments'` 对应视图已渲染时：

```tsx
useEffect(() => {
  const el = document.getElementById('trainer-review-cta');
  if (!el) return;
  const headerOffset = 120; // sticky 顶栏+Tab 约估，可按实测微调
  const rect = el.getBoundingClientRect();
  const absoluteTop = window.scrollY + rect.top;
  const target =
    absoluteTop - window.innerHeight / 2 + rect.height / 2;
  // 避免滚到顶栏下方过少：至少留 headerOffset
  const y = Math.max(target, absoluteTop - headerOffset);
  window.scrollTo({ top: y, behavior: 'smooth' });
}, [/* ReviewsView mount: trainerUserId */ trainerUserId]);
```

注意：Step 2 的 panel scroll 与 Step 3 可能冲突——**评价 Tab 以 CTA 居中为准**，可在 `activeTab === 'comments'` 时跳过 panel 的 `scrollIntoView`，只执行 CTA 居中。

- [ ] **Step 4: 手工验收**

- 打开 `/trainer/{id}.htm`，点击各 Tab：内容顶部不被顶栏挡住；URL 与下划线正确。
- 打开 `/trainer/{id}/comment.htm`：「我要评价」约在视口垂直中线。
- 连续快速点 Tab：滚动可被后续点击打断（浏览器 smooth scroll 默认行为即可）。

- [ ] **Step 5: Commit（仅当用户授权）**

```bash
git add frontend/src/features/trainer/components/detail/TrainerDetailContent.tsx
git commit -m "$(cat <<'EOF'
fix(frontend): 专家详情 Tab 滚动避让顶栏并居中评价按钮

EOF
)"
```

---

### Task 5: 视频分类只保留一级 + 单测（#14）

**Files:**
- Create: `frontend/src/features/video/utils/category-tags.ts`
- Create: `frontend/src/features/video/utils/category-tags.test.ts`
- Modify: `frontend/src/features/video/components/play/VideoPlayPageContent.tsx`

**Interfaces:**
- Produces: `buildVideoCategoryTags(video): { label: string; href?: string }[]` — 最多 1 项

- [ ] **Step 1: 写失败单测**

```ts
// frontend/src/features/video/utils/category-tags.test.ts
import { describe, expect, it } from 'vitest';
import { buildVideoCategoryTags } from './category-tags';

describe('buildVideoCategoryTags', () => {
  it('returns only the first category when sub and keywords exist', () => {
    const tags = buildVideoCategoryTags({
      categoryId: 1,
      categoryName: '领导力',
      subCategoryId: 2,
      subCategoryName: '中层管理',
      keywords: '沟通,演讲',
    });
    expect(tags).toEqual([
      { label: '领导力', href: expect.stringContaining('categoryId=1') },
    ]);
    expect(tags).toHaveLength(1);
  });

  it('returns empty when no categoryName', () => {
    expect(
      buildVideoCategoryTags({
        categoryId: null,
        categoryName: null,
        subCategoryId: 2,
        subCategoryName: '中层管理',
        keywords: '沟通',
      }),
    ).toEqual([]);
  });
});
```

（若 `VideoDetail` 字段类型不允许 null，按实际类型改测试入参。）

- [ ] **Step 2: 跑测确认失败**

Run: `cd frontend && pnpm exec vitest run src/features/video/utils/category-tags.test.ts`  
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现纯函数**

```ts
// frontend/src/features/video/utils/category-tags.ts
import { ROUTES } from '@/config/routes';

type CategoryTagSource = {
  categoryId?: number | null;
  categoryName?: string | null;
  subCategoryId?: number | null;
  subCategoryName?: string | null;
  keywords?: string | null;
};

export function buildVideoCategoryTags(
  video: CategoryTagSource,
): { label: string; href?: string }[] {
  const name = video.categoryName?.trim();
  if (!name) return [];
  const href =
    video.categoryId != null
      ? `${ROUTES.ONLINE_COURSES}?categoryId=${video.categoryId}`
      : undefined;
  return [{ label: name, href }];
}
```

- [ ] **Step 4: 跑测确认通过**

Run: `cd frontend && pnpm exec vitest run src/features/video/utils/category-tags.test.ts`  
Expected: PASS

- [ ] **Step 5: 替换 VideoPlayPageContent 内联逻辑**

```tsx
import { buildVideoCategoryTags } from '../../utils/category-tags';

const categoryTags = useMemo(() => buildVideoCategoryTags(video), [video]);
```

删除原 `categoryTags` 中拼接二级与 keywords 的逻辑。

- [ ] **Step 6: Commit（仅当用户授权）**

```bash
git add frontend/src/features/video/utils/category-tags.ts frontend/src/features/video/utils/category-tags.test.ts frontend/src/features/video/components/play/VideoPlayPageContent.tsx
git commit -m "$(cat <<'EOF'
fix(frontend): 视频播放页分类标签仅保留一级

EOF
)"
```

---

### Task 6: Video.js 中文控件（#12）

**Files:**
- Modify: `frontend/src/features/video/components/player/VideoJsPlayer.tsx`
- Modify: `frontend/src/features/video/components/player/video-player.css`（仅当语言包未覆盖时兜底）

**Interfaces:**
- Produces: player `language: 'zh-CN'`

- [ ] **Step 1: 注册中文语言包**

在 `VideoJsPlayer.tsx`：

```tsx
import zhCN from 'video.js/dist/lang/zh-CN.json';

// 模块级注册一次即可
videojs.addLanguage('zh-CN', zhCN);
```

初始化选项增加：

```tsx
const player = videojs(videoEl, {
  controls: true,
  fill: true,
  language: 'zh-CN',
  // ...其余不变
});
```

- [ ] **Step 2: 确认全屏按钮位置**

Video.js 默认全屏在 controlBar 右侧。若被自定义 skin 打乱，在 `video-player.css` 用 flex order 保证 `.vjs-fullscreen-control` 靠右，**不要**大改皮肤。

- [ ] **Step 3: 手工验收**

打开 `/videos/{id}/play`：控制条可见「全屏」等中文；全屏在右下可用。

- [ ] **Step 4: Commit（仅当用户授权）**

```bash
git add frontend/src/features/video/components/player/VideoJsPlayer.tsx frontend/src/features/video/components/player/video-player.css
git commit -m "$(cat <<'EOF'
fix(frontend): Video.js 播放器控件切换为中文

EOF
)"
```

---

### Task 7: 播放页 150% 缩放左右留白（#13）

**Files:**
- Modify: `frontend/src/features/video/components/play/VideoPlayPageContent.tsx`
- Modify: `frontend/src/app/[locale]/(public)/videos/[id]/play/page.tsx`（仅当外层宽度需收紧）

**Interfaces:**
- Produces: 播放器 + 评价卡在高缩放下仍两侧有可见留白、不出现「左极宽右无空」

- [ ] **Step 1: 调整播放区网格**

将：

```tsx
<div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-stretch">
```

改为更稳健的比例，并保证侧栏不被挤没：

```tsx
<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(240px,280px)] gap-6 items-stretch max-w-6xl mx-auto w-full">
```

同步：

- 侧栏 `hidden xl:block` → `hidden lg:block`（与断点一致）
- 移动端评价卡 `xl:hidden` → `lg:hidden`

外层 page 已有 `max-w-[1280px] mx-auto`；若 150% 仍左偏，将 page 容器改为 `max-w-6xl`（约 1152px）保持居中。

- [ ] **Step 2: 手工验收**

Chrome 缩放到约 150%：播放页左右留白大致对称；评价卡仍可见；播放器不撑出视口。

- [ ] **Step 3: Commit（仅当用户授权）**

```bash
git add frontend/src/features/video/components/play/VideoPlayPageContent.tsx frontend/src/app/[locale]/(public)/videos/[id]/play/page.tsx
git commit -m "$(cat <<'EOF'
fix(frontend): 视频播放页高缩放布局左右留白均衡

EOF
)"
```

---

### Task 8: 总验收

- [ ] **Step 1: lint + 相关单测**

```bash
cd frontend
pnpm lint
pnpm exec vitest run src/features/video/utils/category-tags.test.ts src/features/trainer/utils/routes.test.ts
```

Expected: lint 无新增 error；测试 PASS

- [ ] **Step 2: 对照 spec §5 清单手测**

按 `docs/superpowers/specs/2026-07-28-frontend-opt-batch-a-design.md` §5 逐条勾选 3/5/6/9/10/11/12/13/14。

---

## Spec Coverage Checklist

| Spec 条目 | Task |
|-----------|------|
| #3 筛选关浮层 | Task 1 |
| #5 大卡铺满 | Task 2 |
| #6 常驻城市 | Task 1 |
| #9 顶栏外链 | Task 3 |
| #10 评价居中 | Task 4 |
| #11 Tab 滚动避让 | Task 4 |
| #12 播放器中文 | Task 6 |
| #13 150% 留白 | Task 7 |
| #14 分类只留一级 | Task 5 |
| 总验收 | Task 8 |
