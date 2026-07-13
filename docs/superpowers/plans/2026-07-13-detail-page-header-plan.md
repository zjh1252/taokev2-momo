# 详情页合并顶栏 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在详情页用单行 `DetailPageHeader`（Logo + 频道 + 搜索 + 用户区）替换双层顶栏；列表/首页保持 `TopNavBar` + `AppHeader` 不变。

**Architecture:** 新增 `isDetailPagePath()` 判定 SEO 路径；抽取 `header-logo` / `header-nav-links` / `header-user-actions` 共享片段；`PublicHeader` 按路径在详情与列表两套顶栏间切换。

**Tech Stack:** Next.js 16 App Router、next-intl `usePathname`、Tailwind CSS 4、Vitest（新增，仅测路径工具）

**Spec:** [`docs/superpowers/specs/2026-07-13-detail-page-header-design.md`](../specs/2026-07-13-detail-page-header-design.md)

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `src/lib/is-detail-page-path.ts` | 详情页路径判定（SEO 路径，与 `ROUTES` 一致） |
| `src/lib/is-detail-page-path.test.ts` | 路径判定单测 |
| `src/components/layout/header-logo.tsx` | Logo + 淘课网标题 |
| `src/components/layout/header-nav-links.tsx` | 频道导航 + active 下划线 |
| `src/components/layout/header-user-actions.tsx` | 购物车 + 通知 + 登录/用户 |
| `src/components/layout/detail-page-header.tsx` | 详情页单行顶栏 |
| `src/components/layout/public-header.tsx` | 按路径切换顶栏 |
| `src/components/layout/app-header.tsx` | 列表页第二层，改用共享片段 |
| `src/components/layout/top-nav-bar.tsx` | 列表页第一层，右侧改用 `HeaderUserActions` |
| `src/app/[locale]/(public)/layout.tsx` | 渲染 `<PublicHeader />` |

---

### Task 1: 路径判定工具 + Vitest

**Files:**
- Create: `frontend/src/lib/is-detail-page-path.ts`
- Create: `frontend/src/lib/is-detail-page-path.test.ts`
- Modify: `frontend/package.json`
- Create: `frontend/vitest.config.ts`

- [ ] **Step 1: 安装 Vitest**

```bash
cd frontend
pnpm add -D vitest
```

- [ ] **Step 2: 添加 test 脚本**

在 `frontend/package.json` 的 `scripts` 中增加：

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: 创建 `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 4: 编写失败测试**

`frontend/src/lib/is-detail-page-path.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import { isDetailPagePath } from './is-detail-page-path';

describe('isDetailPagePath', () => {
  it('matches entity detail pages', () => {
    expect(isDetailPagePath('/trainer/1001')).toBe(true);
    expect(isDetailPagePath('/opencourse/12345')).toBe(true);
    expect(isDetailPagePath('/opencourse/TK-000015-1')).toBe(true);
    expect(isDetailPagePath('/inhousecourse/99')).toBe(true);
    expect(isDetailPagePath('/company/88')).toBe(true);
    expect(isDetailPagePath('/association/5')).toBe(true);
    expect(isDetailPagePath('/video/200')).toBe(true);
    expect(isDetailPagePath('/video/200/play')).toBe(true);
    expect(isDetailPagePath('/case/42')).toBe(true);
  });

  it('matches trainer sub-pages', () => {
    expect(isDetailPagePath('/trainer/1001/courses')).toBe(true);
    expect(isDetailPagePath('/trainer/1001/cases')).toBe(true);
    expect(isDetailPagePath('/trainer/1001/cases/9')).toBe(true);
    expect(isDetailPagePath('/trainer/1001/video')).toBe(true);
    expect(isDetailPagePath('/trainer/1001/comment')).toBe(true);
    expect(isDetailPagePath('/trainer/1001/book')).toBe(true);
  });

  it('excludes list and utility pages', () => {
    expect(isDetailPagePath('/')).toBe(false);
    expect(isDetailPagePath('/trainer')).toBe(false);
    expect(isDetailPagePath('/opencourse')).toBe(false);
    expect(isDetailPagePath('/inhousecourse')).toBe(false);
    expect(isDetailPagePath('/company')).toBe(false);
    expect(isDetailPagePath('/association')).toBe(false);
    expect(isDetailPagePath('/video')).toBe(false);
    expect(isDetailPagePath('/case')).toBe(false);
    expect(isDetailPagePath('/search')).toBe(false);
    expect(isDetailPagePath('/cart')).toBe(false);
    expect(isDetailPagePath('/checkout')).toBe(false);
    expect(isDetailPagePath('/city/shanghai')).toBe(false);
    expect(isDetailPagePath('/login')).toBe(false);
    expect(isDetailPagePath('/dashboard')).toBe(false);
    expect(isDetailPagePath('/dashboard/orders')).toBe(false);
  });
});
```

- [ ] **Step 5: 运行测试确认失败**

```bash
cd frontend && pnpm test
```

Expected: FAIL — `isDetailPagePath` not defined

- [ ] **Step 6: 实现 `is-detail-page-path.ts`**

```ts
import { ROUTES } from '@/config/routes';

const TRAINER_SECTIONS = new Set(['courses', 'cases', 'video', 'comment', 'book']);

function isNumericId(segment: string): boolean {
  return /^\d+$/.test(segment);
}

function isTrainerDetailPath(pathname: string): boolean {
  const base = ROUTES.TRAINERS;
  if (!pathname.startsWith(`${base}/`)) return false;
  const rest = pathname.slice(base.length + 1);
  if (!rest) return false;

  const parts = rest.split('/').filter(Boolean);
  if (parts.length === 1) return isNumericId(parts[0]);

  if (!isNumericId(parts[0])) return false;
  if (parts.length === 2) return TRAINER_SECTIONS.has(parts[1]);
  if (parts.length === 3 && parts[1] === 'cases') return isNumericId(parts[2]);

  return false;
}

function isSingleIdDetail(base: string, pathname: string): boolean {
  if (!pathname.startsWith(`${base}/`)) return false;
  const id = pathname.slice(base.length + 1).split('/')[0];
  return Boolean(id) && isNumericId(id);
}

/** 是否为公共站点「点击进入」的详情页（pathname 为 next-intl SEO 路径，无 locale 前缀） */
export function isDetailPagePath(pathname: string): boolean {
  const path = pathname.split('?')[0].replace(/\/$/, '') || '/';

  if (path.startsWith(`${ROUTES.PUBLIC_COURSES}/TK-`)) return true;
  if (isSingleIdDetail(ROUTES.PUBLIC_COURSES, path)) return true;
  if (isSingleIdDetail(ROUTES.INTERNAL_COURSES, path)) return true;
  if (isSingleIdDetail(ROUTES.INSTITUTIONS, path)) return true;
  if (isSingleIdDetail(ROUTES.ASSOCIATIONS, path)) return true;
  if (isSingleIdDetail('/case', path)) return true;

  if (path.startsWith(`${ROUTES.ONLINE_COURSES}/`)) {
    const rest = path.slice(ROUTES.ONLINE_COURSES.length + 1);
    if (/^\d+$/.test(rest)) return true;
    if (/^\d+\/play$/.test(rest)) return true;
  }

  return isTrainerDetailPath(path);
}
```

- [ ] **Step 7: 运行测试确认通过**

```bash
cd frontend && pnpm test
```

Expected: PASS (6 tests)

- [ ] **Step 8: Commit**

```bash
git add frontend/package.json frontend/pnpm-lock.yaml frontend/vitest.config.ts \
  frontend/src/lib/is-detail-page-path.ts frontend/src/lib/is-detail-page-path.test.ts
git commit -m "feat(frontend): add isDetailPagePath helper with vitest"
```

---

### Task 2: 抽取 Header 共享片段

**Files:**
- Create: `frontend/src/components/layout/header-logo.tsx`
- Create: `frontend/src/components/layout/header-nav-links.tsx`
- Create: `frontend/src/components/layout/header-user-actions.tsx`
- Modify: `frontend/src/components/layout/app-header.tsx`
- Modify: `frontend/src/components/layout/top-nav-bar.tsx`

- [ ] **Step 1: 创建 `header-logo.tsx`**

```tsx
'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';

export function HeaderLogo() {
  return (
    <Link href={ROUTES.HOME} className="flex items-center gap-2 shrink-0">
      <Image
        src="/statics/images/taoke-new-logo.jpg"
        alt="淘课网 Logo"
        width={40}
        height={40}
        className="size-10 rounded-md object-contain"
        priority
      />
      <span className="text-2xl font-black tracking-tighter text-slate-900">淘课网</span>
    </Link>
  );
}
```

- [ ] **Step 2: 创建 `header-nav-links.tsx`**

从 `app-header.tsx` 移出 `NAV_LINKS`、`isNavLinkActive`、`HeaderNavLinks`：

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils';

export const NAV_LINKS = [
  { key: 'home', href: ROUTES.HOME },
  { key: 'trainers', href: ROUTES.TRAINERS },
  { key: 'publicCourses', href: ROUTES.PUBLIC_COURSES },
  { key: 'internalCourses', href: ROUTES.INTERNAL_COURSES },
  { key: 'onlineCourses', href: ROUTES.ONLINE_COURSES },
  { key: 'institutions', href: ROUTES.INSTITUTIONS },
  { key: 'associations', href: ROUTES.ASSOCIATIONS },
] as const;

export function isNavLinkActive(href: string, pathname: string): boolean {
  if (href === ROUTES.HOME) {
    return pathname === '/' || pathname === '';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type HeaderNavLinksProps = {
  className?: string;
};

export function HeaderNavLinks({ className }: HeaderNavLinksProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <div className={cn('hidden lg:flex items-stretch gap-8 shrink-0 self-stretch', className)}>
      {NAV_LINKS.map(({ key, href }) => {
        const active = isNavLinkActive(href, pathname);
        return (
          <Link
            key={key}
            href={href}
            className={cn(
              'flex items-center px-0.5 text-[15px] font-medium border-b-4 transition-colors',
              active
                ? 'text-primary border-primary font-bold'
                : 'text-slate-600 border-transparent hover:text-primary hover:border-primary',
            )}
          >
            {t(key)}
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: 创建 `header-user-actions.tsx`**

```tsx
'use client';

import { CartBadge } from '@/features/cart/components/CartBadge';
import { NotificationBell } from '@/features/notification/components/NotificationBell';
import { useAuth } from '@/lib/auth/auth-context';
import { UserAuthArea } from './header-auth';

type HeaderUserActionsProps = {
  className?: string;
};

export function HeaderUserActions({ className }: HeaderUserActionsProps) {
  const { user, loading } = useAuth();

  return (
    <div className={className ?? 'flex items-center gap-3 text-slate-500 text-xs'}>
      {!loading && user && (
        <>
          <CartBadge />
          <span className="text-slate-300">|</span>
          <NotificationBell />
          <span className="text-slate-300">|</span>
        </>
      )}
      <UserAuthArea />
    </div>
  );
}
```

- [ ] **Step 4: 精简 `app-header.tsx`**

```tsx
'use client';

import { Suspense } from 'react';
import { HeaderLogo } from './header-logo';
import { HeaderNavLinks } from './header-nav-links';
import { SearchBar } from './search-bar';

export function AppHeader() {
  return (
    <nav className="h-[80px] w-full bg-white/90 backdrop-blur-md sticky top-[29px] z-40 shadow-sm px-8 flex flex-col justify-center transition-all duration-300">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between h-full">
        <HeaderLogo />
        <HeaderNavLinks />
        <div className="flex items-center ml-4 flex-1 max-w-md justify-end">
          <Suspense fallback={<SearchBarFallback />}>
            <SearchBar />
          </Suspense>
        </div>
      </div>
    </nav>
  );
}

function SearchBarFallback() {
  return (
    <div className="min-w-[360px] h-[38px] rounded-md bg-slate-100 border border-slate-200 animate-pulse" />
  );
}
```

- [ ] **Step 5: 精简 `top-nav-bar.tsx`**

保留左侧 `GROUP_LINKS`；右侧改为 `<HeaderUserActions />`；删除对 `CartBadge`/`NotificationBell`/`UserAuthArea`/`useAuth` 的直接引用。

- [ ] **Step 6: Lint**

```bash
cd frontend && pnpm lint
```

Expected: no new errors

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/layout/header-*.tsx \
  frontend/src/components/layout/app-header.tsx \
  frontend/src/components/layout/top-nav-bar.tsx
git commit -m "refactor(frontend): extract shared header subcomponents"
```

---

### Task 3: DetailPageHeader + PublicHeader

**Files:**
- Create: `frontend/src/components/layout/detail-page-header.tsx`
- Create: `frontend/src/components/layout/public-header.tsx`
- Modify: `frontend/src/app/[locale]/(public)/layout.tsx`

- [ ] **Step 1: 创建 `detail-page-header.tsx`**

```tsx
'use client';

import { Suspense } from 'react';
import { HeaderLogo } from './header-logo';
import { HeaderNavLinks } from './header-nav-links';
import { HeaderUserActions } from './header-user-actions';
import { SearchBar } from './search-bar';

export function DetailPageHeader() {
  return (
    <header className="sticky top-0 z-50 h-[88px] w-full bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100 px-4 sm:px-8">
      <div className="max-w-7xl w-full mx-auto h-full flex items-center gap-3 lg:gap-4">
        <HeaderLogo />
        <HeaderNavLinks />
        <div className="flex flex-1 items-center justify-end gap-3 min-w-0">
          <div className="flex flex-1 max-w-md justify-end min-w-0">
            <Suspense fallback={<SearchBarFallback />}>
              <SearchBar />
            </Suspense>
          </div>
          <HeaderUserActions className="hidden sm:flex items-center gap-3 text-slate-500 text-xs shrink-0" />
        </div>
      </div>
      <div className="sm:hidden max-w-7xl mx-auto px-4 pb-2 flex justify-end">
        <HeaderUserActions className="flex items-center gap-3 text-slate-500 text-xs" />
      </div>
    </header>
  );
}

function SearchBarFallback() {
  return (
    <div className="w-full max-w-[360px] h-[38px] rounded-md bg-slate-100 border border-slate-200 animate-pulse" />
  );
}
```

> 若 88px 一行放不下，可将 `h-[88px]` 调至 `h-[96px]`；窄屏用户区换行展示。

- [ ] **Step 2: 创建 `public-header.tsx`**

```tsx
'use client';

import { usePathname } from '@/i18n/navigation';
import { isDetailPagePath } from '@/lib/is-detail-page-path';
import { AppHeader } from './app-header';
import { DetailPageHeader } from './detail-page-header';
import { TopNavBar } from './top-nav-bar';

export function PublicHeader() {
  const pathname = usePathname();

  if (isDetailPagePath(pathname)) {
    return <DetailPageHeader />;
  }

  return (
    <>
      <TopNavBar />
      <AppHeader />
    </>
  );
}
```

- [ ] **Step 3: 修改 `(public)/layout.tsx`**

将：

```tsx
import { TopNavBar } from '@/components/layout/top-nav-bar';
import { AppHeader } from '@/components/layout/app-header';
```

替换为：

```tsx
import { PublicHeader } from '@/components/layout/public-header';
```

将 JSX 中 `<TopNavBar /><AppHeader />` 替换为 `<PublicHeader />`。

- [ ] **Step 4: 构建检查**

```bash
cd frontend && pnpm build
```

Expected: build succeeds

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/layout/detail-page-header.tsx \
  frontend/src/components/layout/public-header.tsx \
  frontend/src/app/[locale]/(public)/layout.tsx
git commit -m "feat(frontend): merged detail page header with route-based switch"
```

---

### Task 4: 手动验收

- [ ] **Step 1: 启动 dev**

```bash
cd frontend && pnpm.cmd dev
```

- [ ] **Step 2: 列表页（双层顶栏）**

访问 http://localhost:3000/inhousecourse — 应看到集团产品条 + 主导航两层

- [ ] **Step 3: 详情页（单行顶栏）**

从列表点击进入任意内训课详情 — 应仅一层顶栏：Logo + 频道 + 搜索 + 用户区，无集团产品链接

- [ ] **Step 4: 专家子页**

访问专家详情 → 课程/案例子 Tab — 仍为单行顶栏

- [ ] **Step 5: 更新 spec 状态**

在 `docs/superpowers/specs/2026-07-13-detail-page-header-design.md` §10 勾选验收项并标记「已实现」。

- [ ] **Step 6: Commit spec 状态**

```bash
git add docs/superpowers/specs/2026-07-13-detail-page-header-design.md
git commit -m "docs: mark detail page header spec as implemented"
```

---

## Spec 覆盖自检

| Spec 要求 | 对应 Task |
|-----------|-----------|
| `isDetailPagePath` 含专家子页、开课计划 TK- | Task 1 |
| 详情页单行顶栏含用户区 | Task 2–3 |
| 列表页双层不变 | Task 3 `PublicHeader` else 分支 |
| 抽取共享片段 DRY | Task 2 |
| PXB embed 不受影响 | layout 中 `isPxbEmbed` 逻辑未改 |
| 窄屏隐藏频道 | `HeaderNavLinks` 自带 `hidden lg:flex` |
| 单测 | Task 1 |
