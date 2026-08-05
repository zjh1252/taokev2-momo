# TrainerHero 红区与字号微调 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 红白分界右移约中幅、信息块进白区、姓名/头衔/曝光数字略放大，底白装饰同步右移。

**Architecture:** 只改 `TrainerHero.tsx` 中的定量 class：红区 `calc` 末项 `50→96`、信息列间距 `ml-6→ml-24`、字号三处上调；底白装饰优先调 decor `object-position`，不够再加一层贴红右下的白形。

**Tech Stack:** React、Tailwind（现有组件）

**Spec:** [`docs/superpowers/specs/2026-07-14-trainer-hero-polish-design.md`](../specs/2026-07-14-trainer-hero-polish-design.md)

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `frontend/src/features/trainer/components/detail/TrainerHero.tsx` | 唯一修改文件 |

---

### Task 1: 应用定量微调

**Files:**
- Modify: `frontend/src/features/trainer/components/detail/TrainerHero.tsx`

- [ ] **Step 1: 红区余量 50 → 96**

找到：

```tsx
className="absolute inset-y-0 left-0 z-0 overflow-hidden w-[calc((100%-min(100%,1400px))/2+24px+225px+50px)]"
```

改为：

```tsx
className="absolute inset-y-0 left-0 z-0 overflow-hidden w-[calc((100%-min(100%,1400px))/2+24px+225px+96px)]"
```

- [ ] **Step 2: 照片→信息间距 ml-6 → ml-24**

找到包裹信息区的：

```tsx
<div className="relative ml-6 flex min-w-0 flex-1 flex-row">
```

改为：

```tsx
<div className="relative ml-24 flex min-w-0 flex-1 flex-row">
```

- [ ] **Step 3: 字号**

| 元素 | 改前 | 改后 |
|------|------|------|
| 姓名 `h1` | `text-[30px]` | `text-[34px]` |
| 头衔 `span` | `text-[12.5px]` | `text-[14px]` |
| 累计咨询 / 累计曝光数字 | `text-[17px]` | `text-[20px]` |

两处曝光/咨询数字都要改。

- [ ] **Step 4: 底白装饰**

在红区装饰 `Image` 上增加 `object-[right_bottom]` 或 `style={{ objectPosition: 'right 46px center' }}` 试调。若批注中的「底部白色」在 PNG 里仍不对位：在红区容器内追加：

```tsx
<div
  className="pointer-events-none absolute bottom-0 right-0 h-3 w-16 bg-white/90"
  aria-hidden
/>
```

（宽高可按目视微调；水平意图是贴红带右缘底部、照片下方。）

若仅 `object-position` 已够，**不要**加多余白条。

- [ ] **Step 5: 回归检查**

```powershell
Select-String -Path "frontend/src/features/trainer/components/detail/TrainerHero.tsx" -Pattern "225px\+50px|ml-6 flex min-w-0|text-\[30px\]|text-\[17px\]"
```

Expected: 无匹配（旧值已替换）。

```powershell
cd d:\leizonghan\taokev2-mono\frontend
pnpm test -- src/features/trainer/utils/routes.test.ts
```

Expected: 2 passed。

- [ ] **Step 6: Commit**

```powershell
cd d:\leizonghan\taokev2-mono
git add frontend/src/features/trainer/components/detail/TrainerHero.tsx
git -c user.name="雷宗翰" -c user.email="leizonghan@taoke.com" commit -m "fix(frontend): polish TrainerHero red band gap and type sizes"
```

---

### Task 2: 目视验收

- [ ] **Step 1:** 用户/执行者刷新专家详情页核对 spec §4：红界右移、文字在白区、字号、底装饰、右列对齐仍在。

- [ ] **Step 2:** 若文字仍压红：只把 `ml-24` 调到 `ml-28` / `ml-32`，再 commit：

```powershell
git add frontend/src/features/trainer/components/detail/TrainerHero.tsx
git -c user.name="雷宗翰" -c user.email="leizonghan@taoke.com" commit -m "fix(frontend): widen TrainerHero info gap to clear red band"
```

若无需微调则跳过本 commit。

---

## Spec 覆盖

| 要求 | Task |
|------|------|
| 红界 +96 | Task 1 Step 1 |
| 间距进白区 | Task 1 Step 2 |
| 字号 | Task 1 Step 3 |
| 底白装饰同步 | Task 1 Step 4 |
| 交互/内栏不变 | 未改其它文件 |
`}