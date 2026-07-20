# TrainerHero 正文栏对齐 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hero 红区通栏加宽；照片左缘与下方 `max-w-[1400px] px-6` 内容盒左缘对齐；右上操作与「给专家留言」右边线对齐。

**Architecture:** `TrainerHero` 改为「全宽背景层 + 内栏内容层」。红带宽用 `calc((100% - min(100%, 1400px)) / 2 + 24px + 照片宽 + 余量)` 从视口左铺到照片右侧；内容层复用与 `TrainerDetailPageView` 相同的 `max-w-[1400px] mx-auto px-6`；右操作改为内栏内 `items-end` 列，去掉贴视口的 `absolute right-[24px]`。

**Tech Stack:** React Client Component、Tailwind arbitrary `calc`、现有 `SafeImage` / `next/image`、交互逻辑不动

**Spec:** [`docs/superpowers/specs/2026-07-14-trainer-hero-content-align-design.md`](../specs/2026-07-14-trainer-hero-content-align-design.md)

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `frontend/src/features/trainer/components/detail/TrainerHero.tsx` | 唯一改动：双层布局 + 右列对齐 |
| `TrainerDetailPageView.tsx` | 不改（对齐参照） |

**常量（实现时写在组件顶部）：**

```ts
const HERO_MAX_W = 1400; // px，与正文 max-w-[1400px] 一致
const HERO_PAD_X = 24; // px，与 px-6 一致
const PHOTO_W = 225; // 照片外框宽（含视觉主体；边框 5px 叠在内）
const PHOTO_H = 256;
const RED_PAST_PHOTO = 50; // 红区越过照片右缘的余量（形态 B）
```

红带宽 CSS：

```css
width: calc((100% - min(100%, 1400px)) / 2 + 24px + 225px + 50px);
```

Tailwind arbitrary：

`w-[calc((100%-min(100%,1400px))/2+24px+225px+50px)]`

---

### Task 1: 重构 TrainerHero 为双层布局

**Files:**
- Modify: `frontend/src/features/trainer/components/detail/TrainerHero.tsx`

- [ ] **Step 1: 记下当前交互块可复用**

确认以下逻辑在重排 DOM 时**原样保留**（勿改行为）：

- `toggleFavorite` / `favorited` / `favLoading` / `requireAuth`
- `getTrainerDetailTabHref(trainer.id, 'comments')` 评价 Link
- `TrainerMessageDialog` + 留言 CTA
- 联系 / 下载简历：`aria-disabled`、无业务 handler
- `StarRating` / `formatViewCount` / 标签与统计展示

- [ ] **Step 2: 替换 `return (` 的 JSX 外壳为双层结构**

删除现有「`w-[339px]` 左板 + `flex-1` 右白 + `absolute right-[24px]`」结构。用下列骨架替换 section 内部（hooks / helpers / dialog 状态保持在组件内）：

```tsx
  return (
    <section className="relative z-10 w-full h-[322px] mb-6 overflow-hidden bg-white shadow-sm">
      {/* 背景层：红从视口左铺到照片右侧余量 */}
      <div
        className="absolute inset-y-0 left-0 z-0 overflow-hidden w-[calc((100%-min(100%,1400px))/2+24px+225px+50px)]"
        style={{
          backgroundImage:
            'linear-gradient(162.13deg, rgb(140, 20, 31) 0%, rgb(191, 31, 38) 38.9%, rgb(229, 33, 23) 70.7%)',
        }}
        aria-hidden
      >
        <Image
          src="/statics/images/trainer/hero-left-decor.png"
          alt=""
          fill
          unoptimized
          className="object-cover object-right pointer-events-none select-none"
        />
      </div>

      {/* 内容层：与正文同宽同 padding */}
      <div className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-row px-6">
        {/* 照片：左缘 = 内容盒左缘 */}
        <div className="relative flex h-full w-[225px] shrink-0 items-center">
          <div className="relative h-[256px] w-[225px] overflow-hidden border-[5px] border-white bg-slate-100">
            <SafeImage
              src={trainer.avatar}
              alt={displayName}
              width={225}
              height={256}
              apiResolved
              className="h-full w-full object-cover"
            />
          </div>
          {trainer.isTrusted === 1 && (
            <Image
              src="/statics/images/icons/trusted-xin.png"
              alt="信得过"
              width={60}
              height={60}
              className="pointer-events-none absolute -bottom-1 -right-3 h-[60px] w-[60px] select-none object-contain drop-shadow-md"
            />
          )}
        </div>

        {/* 信息 + 右列操作 */}
        <div className="relative ml-6 flex min-w-0 flex-1 flex-row">
          <Image
            src="/statics/images/trainer/hero-taoke-watermark.png"
            alt=""
            width={393}
            height={141}
            unoptimized
            className="pointer-events-none absolute left-8 top-[93px] z-0 w-[393px] h-auto select-none opacity-[0.05]"
            aria-hidden
          />

          {/* 中：文案 + 统计 */}
          <div className="relative z-[1] flex min-w-0 flex-1 flex-col pb-5 pt-9 pr-6">
            {/* 姓名 / 头衔 / 驻地 / 标签 — 从现文件原样迁入 */}
            {/* 底：仅统计盒（留言按钮移到右列） */}
            <div className="mt-auto pt-3">
              {/* 统计盒 markup 从现文件迁入，去掉旁边的留言按钮 */}
            </div>
          </div>

          {/* 右：操作与留言右边线对齐 */}
          <div className="relative z-[1] flex shrink-0 flex-col items-end justify-between pb-5 pt-9">
            <div className="flex flex-col items-end gap-2">
              {/* 收藏 / 评价 / 联系 一行 + 下载简历 — 从现 absolute 块迁入，去掉 absolute 定位类 */}
            </div>
            <button
              type="button"
              onClick={() => requireAuth(() => setMsgOpen(true))}
              className="flex h-[52px] w-[194px] shrink-0 items-center justify-center gap-2.5 rounded bg-[#be0000] text-[13.5px] font-semibold text-white hover:bg-[#be0000]/90"
            >
              <MessageSquare className="size-3.5" />
              给专家留言
            </button>
          </div>
        </div>
      </div>

      <TrainerMessageDialog
        open={msgOpen}
        onOpenChange={setMsgOpen}
        trainerUserId={trainer.userId}
        trainerName={displayName}
        onSuccess={() => toast.success('留言已提交，我们会尽快联系您！')}
      />
    </section>
  );
```

迁入中栏时保留现有 class（姓名 truncate、标签 `max-h-[72px]`、统计盒样式等）。底栏改为**只有统计盒**，留言只出现在右列底部。

- [ ] **Step 3: 确认已删除旧结构特征**

```powershell
Select-String -Path "frontend/src/features/trainer/components/detail/TrainerHero.tsx" -Pattern "w-\[339px\]|absolute right-\[24px\]|pr-\[240px\]|加入对比"
```

Expected: 无匹配。

- [ ] **Step 4: 跑既有路由测试**

```powershell
cd d:\leizonghan\taokev2-mono\frontend
pnpm test -- src/features/trainer/utils/routes.test.ts
```

Expected: 2 passed。

- [ ] **Step 5: Commit**

```powershell
cd d:\leizonghan\taokev2-mono
git add frontend/src/features/trainer/components/detail/TrainerHero.tsx
git -c user.name="雷宗翰" -c user.email="leizonghan@taoke.com" commit -m "feat(frontend): align TrainerHero content to detail column"
```

---

### Task 2: 目视验收与红区余量微调

**Files:**
- Modify: `frontend/src/features/trainer/components/detail/TrainerHero.tsx`（仅当需微调 `50px` 余量或信章位置时）

- [ ] **Step 1: 启动开发服对照**

```powershell
cd d:\leizonghan\taokev2-mono\frontend
pnpm dev
```

打开任意专家详情页，对照 spec §5：

| 检查 | 方法 |
|------|------|
| 照片左 = 下方简介白卡片左 | 宽屏（≥1600）用 DevTools 量左 offset 或目视竖线 |
| 右上组右 = 留言按钮右 | 目视；同属 `items-end` 列应天然对齐 |
| 红贴最左且更宽、照片叠红上 | 目视 |
| `<1400` 横滚、不折行 | 缩窗口 |

- [ ] **Step 2: 若红盖过文字过多或够不着照片右**

只改红区 `calc` 末项余量（`50px` → `40px` / `64px` 等），或 decor 的 `object-right` / `object-center`。**不要**改回 `w-[339px]` 固定左板。

- [ ] **Step 3: 若有微调则再 commit，否则跳过**

```powershell
git add frontend/src/features/trainer/components/detail/TrainerHero.tsx
git -c user.name="雷宗翰" -c user.email="leizonghan@taoke.com" commit -m "fix(frontend): tune TrainerHero red band past-photo inset"
```

---

### Task 3: 收尾

- [ ] **Step 1: `git status -sb`** — 确认只提交了本布局相关改动；勿提交 `.env.local` / 无关 WIP。

- [ ] **Step 2: 再跑路由测试**

```powershell
cd d:\leizonghan\taokev2-mono\frontend
pnpm test -- src/features/trainer/utils/routes.test.ts
```

Expected: PASS。

---

## Spec 覆盖自检

| Spec 要求 | Task |
|-----------|------|
| 红通栏贴左加宽，照片叠红上（形态 B） | Task 1 背景层 calc |
| 照片左 = 正文 `max-w + px-6` 内容盒左 | Task 1 内容层 |
| 右上操作右缘 = 留言右缘 | Task 1 右列 `items-end` |
| 不改 DetailPageView / layout | 全程仅改 TrainerHero |
| 交互不变 | Task 1 Step 1 约束 |
| 缩窗横滚不折行 | 保持 `flex-row` + 现有 public min-width |
`}