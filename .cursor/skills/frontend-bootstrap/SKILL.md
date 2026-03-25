# Frontend Bootstrap Skill（taokev2-mono 企业培训平台）

## 适用场景

当用户提出以下诉求时触发：
- 初始化或重建 `frontend` 工程
- 生成符合规范的前端脚手架（目录 + 通用文件）
- 需要统一 Next.js 16 + Tailwind + shadcn-ui + next-intl 的基线

## 输入信息

| 参数 | 默认值 | 说明 |
|------|--------|------|
| 前端目录 | `frontend` | mono 仓库下的前端根目录 |
| 包管理器 | `pnpm` | 不可更换，全仓统一 |
| 默认语言 | `zh-CN` | |
| 支持语言 | `zh-CN`、`en` | 后续可扩展 `zh-HK`、`zh-TW` |
| Node 版本 | `>= 22 LTS` | |

## 执行原则

1. 技术栈最小化，不引入额外 UI/状态管理库。
2. 先基线可运行，再扩展业务模块。
3. 严格模块化：`app/` 负责路由编排，`modules/` 负责业务实现。
4. `'use client'` 推到最小叶子节点，布局和页面默认 Server Component。
5. i18n 不做二次封装，直接使用 `useTranslations(ns)` / `getTranslations(ns)`。
6. `components/ui/` 禁止调用 `useTranslations`；业务组件可直接使用。

## 标准流程

### 第一步：初始化 Next.js 项目

在仓库根目录执行：

```bash
pnpm dlx create-next-app@latest frontend \
  --ts \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

完成后确认：
- `src/app` 路由目录存在
- `tsconfig.json` 包含 `@/*` 路径别名
- `src/app/globals.css` 已启用 Tailwind 指令

### 第二步：接入 shadcn-ui

```bash
cd frontend
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button
```

建议交互选择：
- style: `default`
- base color: `zinc`
- components path: `src/components`
- utils path: `src/lib/utils.ts`
- css path: `src/app/globals.css`

### 第三步：接入 next-intl

```bash
pnpm add next-intl
```

创建以下文件（模板见下方「通用文件模板」）：
- `src/i18n/request.ts`
- `src/i18n/routing.ts`
- `src/i18n/navigation.ts`
- `src/messages/zh-CN/common.json`
- `src/messages/en/common.json`
- `src/middleware.ts`
- `next.config.ts` 修改（接入 next-intl 插件）

### 第四步：建立目录结构与通用文件

按下方「脚手架目录与文件」章节创建完整目录和占位文件。

### 第五步：验证

```bash
pnpm dev
pnpm build
```

必须通过：
- 开发服务器启动成功
- 生产构建通过
- `/zh-CN` 和 `/en` 页面可访问
- 文案随 locale 切换
- shadcn Button 组件可渲染

---

## 脚手架目录与文件

执行此 Skill 后，`frontend/src/` 下应生成以下完整结构。每个文件包含占位内容和注释，不写实际业务代码。

### 完整目录树

```text
frontend/
  src/
    app/
      [locale]/
        layout.tsx
        (auth)/
          layout.tsx
          login/
            page.tsx
          register/
            page.tsx
        (public)/
          layout.tsx
          page.tsx
          courses/
            page.tsx
          instructors/
            page.tsx
          articles/
            page.tsx
        (portal)/
          layout.tsx
          dashboard/
            page.tsx
          profile/
            page.tsx
          my-courses/
            page.tsx
    components/
      ui/
        button.tsx              # shadcn init 自动生成
      shared/
        .gitkeep
      layout/
        app-header.tsx
        app-footer.tsx
        header-auth.tsx
        user-dropdown.tsx
        auth-layout-wrapper.tsx
    modules/
      course/
        api/
          queries.ts
          mutations.ts
        components/
          .gitkeep
        services/
          .gitkeep
        types/
          course.ts
      user/
        api/
          queries.ts
          mutations.ts
        components/
          .gitkeep
        services/
          .gitkeep
        types/
          user.ts
    lib/
      utils.ts                  # shadcn init 自动生成
      format.ts
      storage.ts
      http/
        client.ts
      auth/
        session.ts
      env/
        client.ts
        server.ts
      permission/
        .gitkeep
    config/
      site.ts
      routes.ts
      constants.ts
    i18n/
      request.ts
      routing.ts
      navigation.ts
    messages/
      zh-CN/
        common.json
        nav.json
        auth.json
        course.json
        user.json
      en/
        common.json
        nav.json
        auth.json
        course.json
        user.json
    types/
      global.d.ts
      api.d.ts
    styles/
      globals.css               # create-next-app 生成，追加 shadcn 变量
  public/
    statics/
      icons/
        .gitkeep
      images/
        .gitkeep
  middleware.ts
  next.config.ts
  tsconfig.json
  .env.example
  package.json
  pnpm-lock.yaml
```

---

## 通用文件模板

### `src/i18n/routing.ts`

```typescript
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['zh-CN', 'en'],
  defaultLocale: 'zh-CN',
  localePrefix: 'as-needed',
});
```

### `src/i18n/navigation.ts`

```typescript
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
```

### `src/i18n/request.ts`

```typescript
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

const namespaces = ['common', 'nav', 'auth', 'course', 'user'];

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  const messages: Record<string, any> = {};

  for (const ns of namespaces) {
    try {
      const mod = (await import(`@/messages/${locale}/${ns}.json`)).default;
      messages[ns] = mod;
    } catch (error) {
      console.error(`Failed to load namespace "${ns}" for locale "${locale}":`, error);
    }
  }

  return { locale, messages };
});
```

### `src/middleware.ts`

```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

### `next.config.ts`（修改）

```typescript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  // 项目配置
};

export default withNextIntl(nextConfig);
```

### `src/app/[locale]/layout.tsx`

```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import '@/styles/globals.css';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'common' });
  return {
    title: t('site.title'),
    description: t('site.description'),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### `src/app/[locale]/(public)/layout.tsx`

```typescript
import { AppHeader } from '@/components/layout/app-header';
import { AppFooter } from '@/components/layout/app-footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main>{children}</main>
      <AppFooter />
    </>
  );
}
```

### `src/app/[locale]/(portal)/layout.tsx`

```typescript
import { AppHeader } from '@/components/layout/app-header';
import { AppFooter } from '@/components/layout/app-footer';
// TODO: 接入 AuthGuard，未登录 redirect 到 /login

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // TODO: await AuthGuard();

  return (
    <>
      <AppHeader />
      <main>{children}</main>
      <AppFooter />
    </>
  );
}
```

### `src/app/[locale]/(auth)/layout.tsx`

```typescript
import { AuthLayoutWrapper } from '@/components/layout/auth-layout-wrapper';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayoutWrapper>{children}</AuthLayoutWrapper>;
}
```

### `src/app/[locale]/(public)/page.tsx`

```typescript
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('common');
  return { title: t('site.title') };
}

export default async function HomePage() {
  const t = await getTranslations('common');

  return (
    <div>
      <h1>{t('site.title')}</h1>
      {/* TODO: 首页内容 */}
    </div>
  );
}
```

### `src/app/[locale]/(auth)/login/page.tsx`

```typescript
'use client';

import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const t = useTranslations('auth');

  return (
    <div>
      <h1>{t('login.title')}</h1>
      {/* TODO: 登录表单 */}
    </div>
  );
}
```

### `src/app/[locale]/(portal)/dashboard/page.tsx`

```typescript
import { getTranslations } from 'next-intl/server';

export default async function DashboardPage() {
  const t = await getTranslations('user');

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      {/* TODO: 仪表盘内容 */}
    </div>
  );
}
```

### `src/components/layout/app-header.tsx`

```typescript
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { HeaderAuth } from './header-auth';

export function AppHeader() {
  const t = useTranslations('nav');

  return (
    <header className="flex items-center justify-between px-6 h-16 border-b">
      <nav className="flex items-center gap-6">
        <Link href="/">{t('home')}</Link>
        <Link href="/courses">{t('courses')}</Link>
        <Link href="/instructors">{t('instructors')}</Link>
        <Link href="/articles">{t('articles')}</Link>
      </nav>
      <HeaderAuth />
    </header>
  );
}
```

### `src/components/layout/app-footer.tsx`

```typescript
import { useTranslations } from 'next-intl';

export function AppFooter() {
  const t = useTranslations('common');

  return (
    <footer className="border-t px-6 py-8 text-sm text-muted-foreground">
      <p>{t('footer.copyright')}</p>
      {/* TODO: 底部链接 */}
    </footer>
  );
}
```

### `src/components/layout/header-auth.tsx`

```typescript
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
// TODO: 接入 getCurrentUser 从 session 判断登录状态

export function HeaderAuth() {
  const t = useTranslations('nav');
  // TODO: const user = await getCurrentUser();

  // 未登录状态
  return (
    <div className="flex items-center gap-3">
      <Link href="/login">{t('login')}</Link>
      <Link href="/register">{t('register')}</Link>
    </div>
  );

  // TODO: 已登录状态返回 <UserDropdown user={user} />
}
```

### `src/components/layout/user-dropdown.tsx`

```typescript
'use client';

import { useState } from 'react';

interface UserDropdownProps {
  user: {
    name: string;
    avatar?: string;
  };
}

export function UserDropdown({ user }: UserDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}>
        {user.name}
      </button>
      {/* TODO: 下拉菜单内容 */}
    </div>
  );
}
```

### `src/components/layout/auth-layout-wrapper.tsx`

```typescript
export function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-6">
        {/* TODO: Logo */}
        {children}
      </div>
    </div>
  );
}
```

### `src/lib/http/client.ts`

```typescript
// TODO: 完善 API 客户端封装
// 参考旧项目 octoprompts 的 lib/api/client.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export class ApiException extends Error {
  constructor(
    public status: number,
    public code?: string,
    message?: string,
  ) {
    super(message || `API 请求失败: ${status}`);
    this.name = 'ApiException';
  }
}

export async function apiClient<T>(
  endpoint: string,
  init?: RequestInit,
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiException(response.status);
  }

  return response.json();
}

// 便捷方法
export const apiGet = <T>(endpoint: string, init?: RequestInit) =>
  apiClient<T>(endpoint, { ...init, method: 'GET' });

export const apiPost = <T>(endpoint: string, data?: unknown, init?: RequestInit) =>
  apiClient<T>(endpoint, { ...init, method: 'POST', body: data ? JSON.stringify(data) : undefined });

export const apiPut = <T>(endpoint: string, data?: unknown, init?: RequestInit) =>
  apiClient<T>(endpoint, { ...init, method: 'PUT', body: data ? JSON.stringify(data) : undefined });

export const apiDelete = <T>(endpoint: string, init?: RequestInit) =>
  apiClient<T>(endpoint, { ...init, method: 'DELETE' });
```

### `src/lib/auth/session.ts`

```typescript
// TODO: 服务端 session 读取
// 用于 Server Component 中判断登录状态

export async function getCurrentUser() {
  // TODO: 从 cookie 读取 token，校验并返回用户信息
  return null;
}
```

### `src/lib/env/client.ts`

```typescript
// 客户端环境变量（NEXT_PUBLIC_* 前缀）

export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL 未配置');
  }
  return url;
}

export function getCdnBaseUrl(): string {
  return process.env.NEXT_PUBLIC_CDN_BASE_URL || getApiBaseUrl();
}
```

### `src/lib/env/server.ts`

```typescript
// 服务端环境变量（不带 NEXT_PUBLIC_ 前缀，仅服务端可用）

// TODO: 按需添加服务端专用变量读取
```

### `src/lib/format.ts`

```typescript
// 通用格式化工具

// TODO: 日期格式化
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('zh-CN');
}

// TODO: 金额格式化
export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

// TODO: 时长格式化
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}
```

### `src/lib/storage.ts`

```typescript
// localStorage 封装

export const storage = {
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },

  set(key: string, value: unknown): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};
```

### `src/config/site.ts`

```typescript
export const siteConfig = {
  name: '淘课网',
  description: '企业培训采购平台',
  url: 'https://taoke.com',
  // TODO: 补充 SEO 默认值
};
```

### `src/config/routes.ts`

```typescript
// 路由路径常量，避免硬编码字符串散落各处

export const ROUTES = {
  HOME: '/',
  COURSES: '/courses',
  INSTRUCTORS: '/instructors',
  ARTICLES: '/articles',
  CASES: '/cases',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  MY_COURSES: '/my-courses',
  MY_ORDERS: '/my-orders',
  CERTIFICATES: '/certificates',
} as const;
```

### `src/config/constants.ts`

```typescript
// 业务常量

export const PAGE_SIZE_DEFAULT = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// TODO: 角色枚举、文件大小限制等
```

### `src/types/global.d.ts`

```typescript
// 全局类型声明
// TODO: 按需扩展
```

### `src/types/api.d.ts`

```typescript
// 通用 API 响应结构（与后端 ApiResponse 对齐）

interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

interface PageResponse<T = unknown> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
```

### `src/modules/course/types/course.ts`

```typescript
// 课程前端领域模型

export interface Course {
  id: number;
  title: string;
  slug: string;
  summary: string;
  coverUrl: string;
  hours: number;
  instructorName: string;
  // TODO: 补充字段
}
```

### `src/modules/course/api/queries.ts`

```typescript
// 课程查询（Server 侧数据获取）

import { apiGet } from '@/lib/http/client';
import type { Course } from '../types/course';

// TODO: 实现课程列表查询
export async function getCourseList(): Promise<Course[]> {
  // TODO: const res = await apiGet<ApiResponse<PageResponse<Course>>>('/api/courses');
  return [];
}

// TODO: 实现课程详情查询
export async function getCourseBySlug(slug: string): Promise<Course | null> {
  // TODO: const res = await apiGet<ApiResponse<Course>>(`/api/courses/${slug}`);
  return null;
}
```

### `src/modules/course/api/mutations.ts`

```typescript
// 课程变更操作（Client 侧）

// TODO: 课程收藏、报名等写操作
```

### `src/modules/user/types/user.ts`

```typescript
// 用户前端领域模型

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  // TODO: 补充字段
}
```

### `src/modules/user/api/queries.ts`

```typescript
// 用户查询

// TODO: 获取当前用户信息、用户资料等
```

### `src/modules/user/api/mutations.ts`

```typescript
// 用户变更操作

// TODO: 更新资料、修改密码等
```

### `src/messages/zh-CN/common.json`

```json
{
  "site": {
    "title": "淘课网 — 企业培训采购平台",
    "description": "连接培训需求方与资源供给方"
  },
  "save": "保存",
  "cancel": "取消",
  "confirm": "确认",
  "delete": "删除",
  "loading": "加载中...",
  "saving": "保存中...",
  "footer": {
    "copyright": "© 2026 淘课网 版权所有"
  }
}
```

### `src/messages/zh-CN/nav.json`

```json
{
  "home": "首页",
  "courses": "课程",
  "instructors": "讲师",
  "articles": "文章",
  "cases": "案例",
  "login": "登录",
  "register": "注册",
  "myCourses": "我的课程",
  "dashboard": "控制台"
}
```

### `src/messages/zh-CN/auth.json`

```json
{
  "login": {
    "title": "登录",
    "email": "邮箱",
    "password": "密码",
    "submit": "登录",
    "forgotPassword": "忘记密码？",
    "noAccount": "没有账号？",
    "register": "注册"
  },
  "register": {
    "title": "注册",
    "name": "姓名",
    "email": "邮箱",
    "password": "密码",
    "confirmPassword": "确认密码",
    "submit": "注册",
    "hasAccount": "已有账号？",
    "login": "登录"
  }
}
```

### `src/messages/zh-CN/course.json`

```json
{
  "list": {
    "title": "全部课程",
    "subtitle": "为企业团队精选的专业培训课程",
    "empty": "暂无课程",
    "meta": {
      "title": "课程列表 — 淘课网",
      "description": "浏览企业培训精品课程"
    }
  },
  "detail": {
    "enroll": "立即报名",
    "duration": "共 {hours} 课时",
    "instructor": "讲师",
    "meta": {
      "suffix": "淘课网"
    }
  }
}
```

### `src/messages/zh-CN/user.json`

```json
{
  "dashboard": {
    "title": "控制台"
  },
  "profile": {
    "title": "个人资料"
  }
}
```

### `src/messages/en/common.json`

```json
{
  "site": {
    "title": "TaoKe — Enterprise Training Platform",
    "description": "Connecting training buyers with resource providers"
  },
  "save": "Save",
  "cancel": "Cancel",
  "confirm": "Confirm",
  "delete": "Delete",
  "loading": "Loading...",
  "saving": "Saving...",
  "footer": {
    "copyright": "© 2026 TaoKe. All rights reserved."
  }
}
```

### `src/messages/en/nav.json`

```json
{
  "home": "Home",
  "courses": "Courses",
  "instructors": "Instructors",
  "articles": "Articles",
  "cases": "Cases",
  "login": "Login",
  "register": "Register",
  "myCourses": "My Courses",
  "dashboard": "Dashboard"
}
```

### `src/messages/en/auth.json`

```json
{
  "login": {
    "title": "Login",
    "email": "Email",
    "password": "Password",
    "submit": "Login",
    "forgotPassword": "Forgot password?",
    "noAccount": "Don't have an account?",
    "register": "Register"
  },
  "register": {
    "title": "Register",
    "name": "Name",
    "email": "Email",
    "password": "Password",
    "confirmPassword": "Confirm Password",
    "submit": "Register",
    "hasAccount": "Already have an account?",
    "login": "Login"
  }
}
```

### `src/messages/en/course.json`

```json
{
  "list": {
    "title": "All Courses",
    "subtitle": "Professional training courses for enterprise teams",
    "empty": "No courses available",
    "meta": {
      "title": "Courses — TaoKe",
      "description": "Browse enterprise training courses"
    }
  },
  "detail": {
    "enroll": "Enroll Now",
    "duration": "{hours} hours",
    "instructor": "Instructor",
    "meta": {
      "suffix": "TaoKe"
    }
  }
}
```

### `src/messages/en/user.json`

```json
{
  "dashboard": {
    "title": "Dashboard"
  },
  "profile": {
    "title": "Profile"
  }
}
```

### `.env.example`

```env
# 后端 API 地址
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# CDN 资源地址（可选）
NEXT_PUBLIC_CDN_BASE_URL=
```

---

## 禁止事项

- 未经用户要求，不引入 Zustand/Redux、TanStack Query、多套 UI 库
- 不封装 `useT()` / `getT()` 等 i18n wrapper，直接使用 `useTranslations` / `getTranslations`
- 不在 `components/ui/` 下调用 `useTranslations`
- 不在 page.tsx 整页标记 `'use client'`，交互部分拆成独立 Client Component
- 不将后端 DTO 类型直接透传到 UI 组件，必须经过 `modules/<domain>/services/` 转换
- 不直接使用 `next/navigation` 的 `Link`/`useRouter`，统一使用 `@/i18n/navigation` 导出的版本
- 不在页面和组件中直接读取 `process.env.*`，统一通过 `lib/env/` 读取

## 输出格式

执行该 Skill 后，输出应包含：
1. 已完成步骤列表（按顺序）
2. 新增/修改文件清单
3. 验证结果（dev / build / i18n / ui）
4. 下一步建议（按业务模块推进）

## 快速调用示例

- "按淘课前端规范初始化 `/frontend`，生成完整脚手架。"
- "在已有 frontend 上补齐缺失的目录和占位文件。"
