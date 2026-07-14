# 详情顶栏精简用户区 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 详情页 `DetailPageHeader` 去掉购物车/通知，改为头像 +「用户中心」+「退出」，并收窄搜索框以免遮挡左侧频道字；列表顶栏不变。

**Architecture:** 给 `UserAuthArea` 增加 `variant="compact"`；给 `SearchBar` 增加可选 `className`；`DetailPageHeader` 改用 compact 用户区 + 收窄搜索，不再挂载 `HeaderUserActions`。列表/`AppHeader`/`TopNavBar` 不改行为。

**Tech Stack:** Next.js App Router、React Client Components、Tailwind、`cn` from `@/lib/utils`、现有 `useAuth` / `ROUTES`

**Spec:** [`docs/superpowers/specs/2026-07-14-detail-header-compact-user-design.md`](../specs/2026-07-14-detail-header-compact-user-design.md)

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `frontend/src/components/layout/search-bar.tsx` | 根 `form` 接受可选 `className`，列表默认宽度不变 |
| `frontend/src/components/layout/header-auth.tsx` | `UserAuthArea` 支持 `variant: 'default' \| 'compact'` |
| `frontend/src/components/layout/detail-page-header.tsx` | 详情顶栏：收窄 SearchBar + compact UserAuthArea；去掉 HeaderUserActions |
| `frontend/src/components/layout/header-user-actions.tsx` | **不改**（列表仍用完整用户区） |
| `frontend/src/components/layout/app-header.tsx` | **不改**（SearchBar 不传 className） |
| `frontend/src/components/layout/public-header.tsx` | **不改**（路径切换照旧） |

本改动为纯展示变体，spec 不要求新增单元测试；每步以目视/grep 验收，并频繁提交。

---

### Task 1: SearchBar 支持可选 className

**Files:**
- Modify: `frontend/src/components/layout/search-bar.tsx`

- [ ] **Step 1: 给 SearchBar 增加 className prop**

将 `export function SearchBar()` 改为接受可选 `className`，并用 `cn` 合并到根 `form`（默认仍带 `min-w-[360px]`；调用方传入的类可覆盖宽度，例如 `min-w-0`）。

完整替换函数签名与 form 开标签附近如下：

```tsx
import { cn } from '@/lib/utils';

// ... existing imports 保持不动 ...

type SearchBarProps = {
  className?: string;
};

/**
 * 顶部搜索栏 — 分类下拉 + 关键词 + 搜索按钮
 *
 * <p>专家/公开课/内训课走 ES 全文搜索页；录播课/机构/培协跳转对应列表页并带 {@code keyword}。</p>
 */
export function SearchBar({ className }: SearchBarProps = {}) {
```

注意：若编译器对默认参数 `= {}` 与解构不满意，改为：

```tsx
export function SearchBar({ className }: SearchBarProps = {}) {
```

或更稳妥：

```tsx
export function SearchBar({ className }: SearchBarProps) {
```

（无调用方可不传；TypeScript 可选 prop 即可。）

将根 form 的 `className` 改为：

```tsx
  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'flex items-center bg-slate-100 rounded-md overflow-visible p-0.5 border border-slate-200 relative min-w-[360px]',
        className,
      )}
    >
```

确保文件顶部已有：

```tsx
import { cn } from '@/lib/utils';
```

其余逻辑（下拉、提交、`SearchCategoryMenu`）一字不改。`AppHeader` 继续 `<SearchBar />`，外观不变。

- [ ] **Step 2: 快速确认无类型错误**

```bash
cd d:\leizonghan\taokev2-mono\frontend
pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | Select-Object -First 40
```

Expected: 与本次改动无关的既有错误可忽略；不应出现 `SearchBar` / `cn` / `className` 相关报错。若全绿更好。

- [ ] **Step 3: Commit**

```bash
cd d:\leizonghan\taokev2-mono
git add frontend/src/components/layout/search-bar.tsx
git commit -m "feat(frontend): allow SearchBar className for detail header width"
```

---

### Task 2: UserAuthArea compact 变体

**Files:**
- Modify: `frontend/src/components/layout/header-auth.tsx`

- [ ] **Step 1: 增加 variant prop 与类型**

在 `header-auth.tsx` 中，将 `UserAuthArea` 改为接收：

```tsx
type UserAuthAreaProps = {
  /** default: 列表完整用户区；compact: 详情顶栏仅头像+用户中心+退出 */
  variant?: 'default' | 'compact';
};

export function UserAuthArea({ variant = 'default' }: UserAuthAreaProps) {
```

保留现有 hooks / loading / 未登录分支逻辑。

- [ ] **Step 2: compact 已登录渲染**

在 `if (!user)` 的未登录 return **之后**（loading / 未登录分支保持现状），用 `variant === 'compact'` 提前返回精简 UI。替换当前已登录整段 return 为条件分支：

未登录块保持不变后，已登录逻辑改为：

```tsx
  const initials = getInitials(user.nickname);
  const showAvatar = user.avatarUrl && !avatarBroken;

  const avatarNode = showAvatar ? (
    <Image
      src={resolveImageSrc(user.avatarUrl)}
      alt={user.nickname}
      width={22}
      height={22}
      unoptimized
      className="size-[22px] rounded-full object-cover"
      onError={() => setAvatarBroken(true)}
    />
  ) : (
    <div className="size-[22px] rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold shrink-0">
      {initials}
    </div>
  );

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 shrink-0">
        {avatarNode}
        <Separator />
        <Link
          href={ROUTES.DASHBOARD}
          className="hover:text-primary transition-colors whitespace-nowrap"
        >
          {t('userCenter')}
        </Link>
        <Separator />
        <button
          type="button"
          onClick={logout}
          className="hover:text-primary transition-colors cursor-pointer whitespace-nowrap"
        >
          {t('logout')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {avatarNode}
      <span className="text-slate-700 font-medium max-w-[160px] truncate">
        {user.nickname}
        {roleSuffix && <span className="text-slate-500 ml-1">{roleSuffix}</span>}
      </span>
      <Separator />
      <Link
        href={ROUTES.DASHBOARD}
        className="hover:text-primary transition-colors"
      >
        {t('userCenter')}
      </Link>
      {publicHomeHref && (
        <>
          <Separator />
          <Link
            href={publicHomeHref}
            className="hover:text-primary transition-colors"
          >
            {t('myPage')}
          </Link>
        </>
      )}
      <Separator />
      <button
        type="button"
        onClick={logout}
        className="hover:text-primary transition-colors cursor-pointer"
      >
        {t('logout')}
      </button>
    </div>
  );
```

要点：

- `compact` **不渲染**昵称、角色后缀、`publicHomeHref`（我的主页）。
- `default` 行为与改前一致（可用上面等价重构；勿漏 `roleSuffix` / `publicHomeHref`）。
- `HeaderUserActions` 仍写 `<UserAuthArea />`，默认 `default`，列表行为不变。

- [ ] **Step 3: Commit**

```bash
cd d:\leizonghan\taokev2-mono
git add frontend/src/components/layout/header-auth.tsx
git commit -m "feat(frontend): add UserAuthArea compact variant for detail header"
```

---

### Task 3: 接线 DetailPageHeader

**Files:**
- Modify: `frontend/src/components/layout/detail-page-header.tsx`

- [ ] **Step 1: 替换右侧用户区并收窄搜索**

将 `detail-page-header.tsx` 整文件改为：

```tsx
'use client';

import { Suspense } from 'react';
import { HeaderLogo } from './header-logo';
import { HeaderNavLinks } from './header-nav-links';
import { UserAuthArea } from './header-auth';
import { SearchBar } from './search-bar';

/**
 * 详情页单行顶栏 — Logo + 频道导航 + 收窄搜索 + 精简用户区（无购物车/通知）
 */
export function DetailPageHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100">
      <div className="h-[88px] max-w-7xl w-full mx-auto px-4 sm:px-8 flex items-center gap-3 lg:gap-4">
        <HeaderLogo />
        <HeaderNavLinks />
        <div className="flex flex-1 items-center justify-end gap-3 min-w-0">
          <div className="flex justify-end min-w-0 shrink">
            <Suspense fallback={<SearchBarFallback />}>
              <SearchBar className="min-w-0 max-w-[280px] w-full [&_input]:min-w-0" />
            </Suspense>
          </div>
          <UserAuthArea variant="compact" />
        </div>
      </div>
    </header>
  );
}

function SearchBarFallback() {
  return (
    <div className="w-full max-w-[280px] h-[38px] rounded-md bg-slate-100 border border-slate-200 animate-pulse" />
  );
}
```

要点：

- **删除** `HeaderUserActions` 的 import 与使用。
- 搜索 `className` 同时压掉 form 的 `min-w-[360px]` 与内部 input 的 `min-w-[180px]`（`[&_input]:min-w-0`），避免 280px 上限被内部最小宽度顶破。
- 目视若仍挡频道字，可将 `max-w-[280px]` 改为 `max-w-[240px]`（同一 PR 微调即可，以左侧文字完整可见为准）。

- [ ] **Step 2: 确认无残留 HeaderUserActions**

```bash
cd d:\leizonghan\taokev2-mono\frontend
rg "HeaderUserActions" src/components/layout/detail-page-header.tsx
```

Expected: 无匹配。

```bash
rg "HeaderUserActions" src/components/layout/
```

Expected: 仅出现在 `header-user-actions.tsx` 自身定义，以及 `app-header.tsx` / `top-nav-bar.tsx`（列表）若仍引用；**不应**再出现在 `detail-page-header.tsx`。

- [ ] **Step 3: Commit**

```bash
cd d:\leizonghan\taokev2-mono
git add frontend/src/components/layout/detail-page-header.tsx
git commit -m "fix(frontend): compact detail header user area and narrow search"
```

---

### Task 4: 手工验收

**Files:** 无代码改动（除非验收发现搜索仍挡字，再微调 `max-w` 并追加 commit）

- [ ] **Step 1: 详情页已登录**

浏览器打开任一详情页（例：专家详情，路径需满足 `isDetailPagePath`）。

验收：

- [ ] 顶栏**无**购物车文案/图标、**无**通知铃与红点  
- [ ] 有头像、「用户中心」、「退出」  
- [ ] **无**昵称 /「（个人学员）」类角色后缀 /「我的主页」  
- [ ] Logo + 频道导航文字完整可见，不被搜索遮挡  

- [ ] **Step 2: 详情页未登录**（隐身或退出后）

验收：

- [ ] 显示登录 | 注册  
- [ ] 无购物车/通知  

- [ ] **Step 3: 列表页对照**

打开专家列表或首页。

验收：

- [ ] 仍有 TopNavBar / AppHeader 双层或列表既有结构  
- [ ] 已登录时仍有购物车、通知、完整昵称用户区  

- [ ] **Step 4:（可选）微调搜索宽度**

若详情仍挡字：只改 `detail-page-header.tsx` 中 `max-w-[280px]` → `max-w-[240px]`（fallback 同步），再 commit：

```bash
git add frontend/src/components/layout/detail-page-header.tsx
git commit -m "fix(frontend): further narrow detail header search"
```

---

## Spec 覆盖自检

| Spec 要求 | Task |
|-----------|------|
| 详情去掉购物车/通知 | Task 3 移除 HeaderUserActions |
| 头像 + 用户中心 + 退出 | Task 2 compact |
| 去掉昵称/我的主页（详情） | Task 2 compact |
| 未登录登录/注册 | Task 2 未登录分支不变 |
| 搜索可缩短 | Task 1 + Task 3 className |
| 列表顶栏不变 | Task 1/2 默认行为；不改 HeaderUserActions |
| 不改 isDetailPagePath | 无相关 task |

无 TBD/占位；`variant` / `className` 命名在 Tasks 1–3 一致。
