# 详情页合并顶栏设计

**日期**：2026-07-13  
**分支**：`0713-lzh`  
**范围**：`frontend` 公共站点详情页顶栏布局  
**不在范围**：列表页/首页顶栏、用户中心、Auth、PXB embed、后端 API

---

## 1. 背景与目标

当前公共页使用双层 sticky 顶栏：

1. `TopNavBar` — 集团产品矩阵链接（左）+ 购物车/通知/登录（右），约 29px
2. `AppHeader` — Logo + 频道导航 + 搜索，80px，`top-[29px]`

用户在详情页（从列表点击进入的实体页）希望：

- **去掉**顶部集团产品跳转条
- **将**主导航（Logo + 频道 + 搜索）上移到顶层，与购物车/通知/登录**同一行**
- **保留**列表页/首页等外部页面的双层导航不变
- 高度可适当增加，确保元素完整展示
- 窄屏行为与列表页一致（`lg` 以下隐藏频道文字）

---

## 2. 用户决策

| 项 | 选择 |
|----|------|
| 方案 | **方案 1**：新建 `DetailPageHeader`，layout 按路径切换 |
| 详情页用户区 | **A** — 购物车 / 通知 / 登录与用户区保留在同一行右侧 |
| 详情页范围 | **A** — 所有带实体 ID 的路由及子页 |
| 窄屏布局 | **A** — 与列表页一致，`lg` 以下隐藏频道，保留 Logo + 搜索 + 用户区 |

---

## 3. 方案选型

| 方案 | 结论 |
|------|------|
| **新建 `DetailPageHeader` + layout 切换** | **采用** — 列表/详情职责分离，改动可控 |
| `AppHeader` 增加 `variant="detail"` | 不采用 — 单文件职责过重 |
| 新建 `(detail)` 路由组迁移页面 | 不采用 — 迁移成本高 |

---

## 4. 详情页路径判定

新增 `frontend/src/lib/is-detail-page-path.ts`，导出 `isDetailPagePath(pathname: string): boolean`。

`pathname` 为 **去掉 locale 前缀** 后的路径（与 `usePathname()` from `@/i18n/navigation` 一致）。

### 4.1 匹配为详情页（`true`）

| 模式 | 示例 |
|------|------|
| `/opencourses/{id}` | `/opencourses/12345` |
| `/opencourses/plan/{code}` | `/opencourses/plan/TK-xxx-N` |
| `/innercourses/{id}` | `/innercourses/99` |
| `/trainers/{id}` | `/trainers/1001` |
| `/trainers/{id}/courses` | 专家课程列表子页 |
| `/trainers/{id}/cases` | 专家案例列表子页 |
| `/trainers/{id}/cases/{caseId}` | 专家下单个案例 |
| `/trainers/{id}/{section}` | `video` / `comment` / `book` 等 |
| `/institutions/{id}` | `/institutions/88` |
| `/associations/{id}` | `/associations/5` |
| `/videos/{id}` | `/videos/200` |
| `/videos/{id}/play` | 录播播放页 |
| `/cases/{id}` | `/cases/42` |

实现建议：用一组正则或前缀 + 段数规则；`id`/`code` 段为非空且非保留字（如 `plan` 仅出现在 `opencourses/plan/` 固定段）。

### 4.2 明确排除（`false`）

- `/`、`/trainers`、`/opencourses`、`/innercourses`、`/institutions`、`/associations`、`/videos`、`/cases`（列表）
- `/search`、`/cart`、`/checkout`、`/city/*`、频道列表带 query 的列表页
- `/login`、`/register` 等 auth
- `/dashboard/**` 用户中心

### 4.3 单元测试

`frontend/src/lib/is-detail-page-path.test.ts`（或项目现有测试目录）覆盖：

- 各频道详情 + 专家子页 → `true`
- 各频道列表 + 首页 + 搜索 → `false`
- 带 locale 的路径在调用前已剥离，测试用无 locale 路径

---

## 5. 组件设计

### 5.1 新建 `DetailPageHeader`

**文件**：`frontend/src/components/layout/detail-page-header.tsx`

**结构（桌面 `lg+`）**：

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Logo]  首页 专家 公开课 内训课 录播课 机构 培协  [SearchBar]  🛒 | 🔔 | 用户 │
└──────────────────────────────────────────────────────────────────────────┘
```

| 区域 | 来源 | 说明 |
|------|------|------|
| Logo + 标题 | 自 `AppHeader` 抽取 | 链回首页，样式一致 |
| 频道导航 | 自 `AppHeader` 抽取 | `NAV_LINKS` + `isNavLinkActive`，红色底边激活态 |
| 搜索 | `SearchBar` | 与列表页相同组件 |
| 用户区 | 自 `TopNavBar` 抽取 | `CartBadge`、`NotificationBell`、`UserAuthArea`，已登录显示购物车+通知 |

**样式**：

- `sticky top-0 z-50`
- 高度：`h-[88px]`（实现时可在 88–96px 微调，以一行容纳所有元素为准）
- 背景：`bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100`
- 容器：`max-w-7xl mx-auto px-8 flex items-center justify-between gap-4`

**窄屏（`< lg`）**：

- 隐藏频道导航（`hidden lg:flex`）
- 保留 Logo、搜索、`UserAuthArea`；已登录时保留购物车与通知

### 5.2 抽取共享片段（避免三处复制）

| 新文件 | 职责 |
|--------|------|
| `header-logo.tsx` | Logo + 「淘课网」文字链接 |
| `header-nav-links.tsx` | `NAV_LINKS` 渲染 + active 态 |
| `header-user-actions.tsx` | 购物车 + 通知 + `UserAuthArea` |

`AppHeader` 与 `DetailPageHeader` 均引用上述片段；`TopNavBar` 右侧改为引用 `header-user-actions.tsx`。

### 5.3 `PublicHeader` 路由切换器

**文件**：`frontend/src/components/layout/public-header.tsx`（client component）

```tsx
const pathname = usePathname();
if (isDetailPagePath(pathname)) return <DetailPageHeader />;
return (
  <>
    <TopNavBar />
    <AppHeader />
  </>
);
```

`(public)/layout.tsx` 将 `<TopNavBar /><AppHeader />` 替换为 `<PublicHeader />`。

---

## 6. 布局与粘性定位

| 页面类型 | 顶栏 | `main` 顶部偏移 |
|----------|------|------------------|
| 列表/首页 | `TopNavBar` + `AppHeader`（不变） | 无额外 offset（沿用 sticky 叠放） |
| 详情页 | 仅 `DetailPageHeader` | 无第二层 offset；详情页仅一层 `top-0` |

详情页移除 `AppHeader` 的 `top-[29px]` 依赖；`DetailPageHeader` 单独 `top-0`。

---

## 7. 不受影响范围

- **PXB embed**：`isPxbEmbed` 时仍不渲染任何顶栏（现有逻辑不变）
- **用户中心** `UserCenterHeader`：本需求不修改
- **Auth 布局**：不修改
- **页面内 `PageBreadcrumb`**：仍在 `main` 内容区，位置不变

---

## 8. 验收标准

- [x] 公开课/内训课/专家/机构/培协/录播/案例 **详情页** 仅显示单行顶栏，无集团产品链接条
- [x] 详情页顶栏含 Logo、频道（桌面）、搜索、购物车（已登录）、通知（已登录）、登录/用户区
- [x] 专家详情子页（courses/cases/section/caseId）与播放页同样使用单行顶栏
- [x] **列表页、首页** 仍为双层顶栏，视觉与改动前一致
- [x] `lg` 以下详情页隐藏频道，保留 Logo + 搜索 + 用户区
- [x] 频道 active 下划线在详情页正确高亮（如在内训课详情高亮「内训课」）
- [x] `isDetailPagePath` 单测通过

---

## 9. 实现文件清单（预估）

| 操作 | 路径 |
|------|------|
| Create | `src/lib/is-detail-page-path.ts` |
| Create | `src/lib/is-detail-page-path.test.ts` |
| Create | `src/components/layout/detail-page-header.tsx` |
| Create | `src/components/layout/public-header.tsx` |
| Create | `src/components/layout/header-logo.tsx` |
| Create | `src/components/layout/header-nav-links.tsx` |
| Create | `src/components/layout/header-user-actions.tsx` |
| Modify | `src/components/layout/app-header.tsx` — 使用抽取片段 |
| Modify | `src/components/layout/top-nav-bar.tsx` — 右侧改用 `header-user-actions` |
| Modify | `src/app/[locale]/(public)/layout.tsx` — 使用 `PublicHeader` |

---

## 10. 状态

- [x] 需求与方案已确认（2026-07-13）
- [x] 用户审阅 spec
- [x] 实施计划（`writing-plans`）
- [x] 开发实现
