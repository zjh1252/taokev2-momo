# TrainerHero 改版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按 Figma 图1 重做专家详情 `TrainerHero`（左固定红区 + 右拉宽白区、高 322px），并在公共 layout 接线 `min-width` + 横向滚动。

**Architecture:** Hero 通栏移出限宽容器；左侧用 Figma 导出装饰图保证一比一，证件照与「信」章叠层；右侧纯布局组件承载信息与操作；`getTrainerDetailTabHref` 供「评价」跳转；公共 `(public)/layout` 外包一层 `overflow-x-auto` + 内层 `min-w-[1400px]`，PXB embed 分支不动。

**Tech Stack:** Next.js App Router、React Client Component、Tailwind、`SafeImage` / `next/image`、`Link` from `@/i18n/navigation`、Vitest（仅路由 href）、现有 favorite / message 交互 API

**Spec:** [`docs/superpowers/specs/2026-07-14-trainer-hero-redesign-design.md`](../specs/2026-07-14-trainer-hero-redesign-design.md)

**Figma:** file `oH4ffDnHm2XLhgwLzXKyOw`，图1 Hero 节点 `17:4`，左侧装饰矢量层 `17:5`

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `frontend/public/statics/images/icons/trainer-hero-review.png` | 「评价」icon（用户提供） |
| `frontend/public/statics/images/icons/trainer-hero-contact.png` | 「联系」icon（用户提供） |
| `frontend/public/statics/images/trainer/hero-taoke-watermark.png` | 右侧 TAOKE 水印（用户提供） |
| `frontend/public/statics/images/trainer/hero-left-decor.png` | 左侧红底+平行四边形（从 Figma `17:5` 导出，保证一比一） |
| `frontend/src/features/trainer/utils/routes.test.ts` | `getTrainerDetailTabHref` 评价 Tab 单测 |
| `frontend/src/app/[locale]/(public)/layout.tsx` | 公共壳 `min-width` + 横滚 |
| `frontend/src/features/trainer/components/detail/TrainerDetailPageView.tsx` | Hero 通栏；面包屑/正文仍限宽 |
| `frontend/src/features/trainer/components/detail/TrainerHero.tsx` | 整卡改版（图1） |

**用户素材源路径（实现时复制进 public）：**

| 用途 | Cursor assets 文件 |
|------|-------------------|
| 评价 icon | `...images___-ce584193-4c73-496c-b48e-5bbcedd2cb9d.png` |
| 联系 icon | `...images___-71e70091-c286-4ff7-a719-be5cfdb81351.png` |
| 水印 | `...images_____-0932d8f2-e19c-4c1d-90c9-7ef38c3ab653.png` |

完整目录：`C:\Users\86152\.cursor\projects\d-leizonghan\assets\`

---

### Task 1: 静态资源就位

**Files:**
- Create: `frontend/public/statics/images/icons/trainer-hero-review.png`
- Create: `frontend/public/statics/images/icons/trainer-hero-contact.png`
- Create: `frontend/public/statics/images/trainer/hero-taoke-watermark.png`
- Create: `frontend/public/statics/images/trainer/hero-left-decor.png`

- [ ] **Step 1: 创建目录并复制用户 icon / 水印**

在仓库根 `taokev2-mono` 下 PowerShell：

```powershell
New-Item -ItemType Directory -Force -Path "frontend/public/statics/images/icons" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/public/statics/images/trainer" | Out-Null

$assets = "C:\Users\86152\.cursor\projects\d-leizonghan\assets"
Copy-Item "$assets\c__Users_86152_AppData_Roaming_Cursor_User_workspaceStorage_f4ba807d6e5bfb95e3213420c85a8ba9_images___-ce584193-4c73-496c-b48e-5bbcedd2cb9d.png" `
  "frontend/public/statics/images/icons/trainer-hero-review.png"
Copy-Item "$assets\c__Users_86152_AppData_Roaming_Cursor_User_workspaceStorage_f4ba807d6e5bfb95e3213420c85a8ba9_images___-71e70091-c286-4ff7-a719-be5cfdb81351.png" `
  "frontend/public/statics/images/icons/trainer-hero-contact.png"
Copy-Item "$assets\c__Users_86152_AppData_Roaming_Cursor_User_workspaceStorage_f4ba807d6e5bfb95e3213420c85a8ba9_images_____-0932d8f2-e19c-4c1d-90c9-7ef38c3ab653.png" `
  "frontend/public/statics/images/trainer/hero-taoke-watermark.png"
```

- [ ] **Step 2: 从 Figma 导出左侧装饰（节点 `17:5`）**

用 Figma MCP `get_design_context`（fileKey `oH4ffDnHm2XLhgwLzXKyOw`, nodeId `17:5`）拿到 `imgRectangle9` 短时 URL，下载到本地：

```powershell
# 将 <ASSET_URL> 替换为 MCP 返回的 Rectangle9 资源 URL（约 7 天有效）
curl.exe -L -o "frontend/public/statics/images/trainer/hero-left-decor.png" "<ASSET_URL>"
```

若 MCP URL 失效：在 Figma Dev Mode 对 `17:5` / Rectangle 9 export PNG @2x，仍保存为同名文件。

- [ ] **Step 3: 确认四个文件存在且非空**

```powershell
Get-Item frontend/public/statics/images/icons/trainer-hero-review.png,
         frontend/public/statics/images/icons/trainer-hero-contact.png,
         frontend/public/statics/images/trainer/hero-taoke-watermark.png,
         frontend/public/statics/images/trainer/hero-left-decor.png |
  Select-Object Name, Length
```

Expected: 四个文件 `Length > 0`。

- [ ] **Step 4: Commit**

```bash
git add frontend/public/statics/images/icons/trainer-hero-review.png \
        frontend/public/statics/images/icons/trainer-hero-contact.png \
        frontend/public/statics/images/trainer/hero-taoke-watermark.png \
        frontend/public/statics/images/trainer/hero-left-decor.png
git -c user.name="雷宗翰" -c user.email="leizonghan@taoke.com" commit -m "chore(frontend): add TrainerHero redesign static assets"
```

---

### Task 2: 评价 Tab href 单测

**Files:**
- Create: `frontend/src/features/trainer/utils/routes.test.ts`
- Modify:（无，复用现有 Vitest）

- [ ] **Step 1: 写失败测试**

创建 `frontend/src/features/trainer/utils/routes.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import { getTrainerDetailTabHref } from './routes';

describe('getTrainerDetailTabHref', () => {
  it('returns home SEO path by default', () => {
    expect(getTrainerDetailTabHref(1001)).toBe('/trainer/1001.htm');
  });

  it('returns comments tab path for 评价入口', () => {
    expect(getTrainerDetailTabHref(1001, 'comments')).toBe('/trainer/1001/comment.htm');
  });
});
```

- [ ] **Step 2: 跑测试（应通过——函数已存在）**

```bash
cd frontend
pnpm test -- src/features/trainer/utils/routes.test.ts
```

Expected: PASS（2 tests）。若 FAIL，核对 `routes.ts` 中 `TRAINER_TAB_SLUGS.comments === 'comment'`。

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/trainer/utils/routes.test.ts
git -c user.name="雷宗翰" -c user.email="leizonghan@taoke.com" commit -m "test(frontend): cover trainer comments tab href for hero 评价"
```

---

### Task 3: 公共 layout 固定宽 + 横向滚动

**Files:**
- Modify: `frontend/src/app/[locale]/(public)/layout.tsx`

- [ ] **Step 1: 在非 PXB 分支外包横滚壳**

将 `return (` 后非 embed 分支改为（保留 import 与 embed 分支不变）：

```tsx
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[1400px]">
        <PublicHeader />
        <main className="flex-1 bg-[var(--page-bg)]">{children}</main>
        <AppFooter />
      </div>
      <FloatingActions />
    </div>
  );
```

说明：`FloatingActions` 放在 `min-w` 外，避免随横滚一起被推走；若现网浮层定位依赖 `main` 祖先，发现问题再挪回内层。

- [ ] **Step 2: 本地目视验收**

```bash
cd frontend
pnpm dev
```

打开任意公共页（如 `/trainer` 列表）：浏览器宽度 > 1400 无横条；拖窄到 < 1400 出现横向滚动条；PXB embed 入口（若可测）不应包这层壳。

- [ ] **Step 3: Commit**

```bash
git add "frontend/src/app/[locale]/(public)/layout.tsx"
git -c user.name="雷宗翰" -c user.email="leizonghan@taoke.com" commit -m "feat(frontend): pin public site min-width with horizontal scroll"
```

---

### Task 4: 专家详情页 Hero 通栏

**Files:**
- Modify: `frontend/src/features/trainer/components/detail/TrainerDetailPageView.tsx`

- [ ] **Step 1: 拆容器——Hero 在限宽外**

将整个 `return` 替换为：

```tsx
  return (
    <>
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <PageBreadcrumb
          items={[
            { label: '培训专家', href: '/trainer' },
            { label: displayName || '专家详情' },
          ]}
        />
      </div>

      <TrainerHero trainer={trainer} />

      <div className="max-w-[1400px] mx-auto px-6 pb-6 space-y-6">
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_300px] gap-6 items-start">
          <div>
            <TrainerDetailContent
              activeTab={activeTab}
              trainer={trainer}
              courses={courses}
              coursesTotal={coursesTotal}
              cases={cases}
              highlights={highlights}
              videos={videos}
              videosTotal={videosTotal}
              books={books}
            />
          </div>
          <TrainerSidebar trainer={trainer} />
        </section>
      </div>
    </>
  );
```

注意：去掉原包络层上的 `lg:px-8` / 整页单一 `space-y-6`；Hero 自身用 `mt/mb` 控制与上下间距（见 Task 5）。

- [ ] **Step 2: 目视**

打开 `/trainer/{id}.htm`：Hero 左右应贴齐 `min-w` 内容区边缘（相对 `main` 全宽），面包屑与下方 Tab 仍居中限宽。

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/trainer/components/detail/TrainerDetailPageView.tsx
git -c user.name="雷宗翰" -c user.email="leizonghan@taoke.com" commit -m "feat(frontend): full-bleed TrainerHero outside max-width column"
```

---

### Task 5: 重写 TrainerHero（图1）

**Files:**
- Modify: `frontend/src/features/trainer/components/detail/TrainerHero.tsx`（整文件替换）

- [ ] **Step 1: 用下列完整实现替换文件内容**

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { SafeImage } from '@/components/safe-image';
import { Star, StarHalf, MessageSquare, Heart, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import type { TrainerDetail } from '../../types';
import {
  addFavorite,
  removeFavorite,
  getInteractionState,
} from '@/features/interaction/api/service';
import TrainerMessageDialog from '@/features/interaction/components/TrainerMessageDialog';
import { useAuthGuard } from '@/lib/auth/auth-guard-context';
import { pickDisplayTitle, plainIntroOrUndefined } from '../../utils/displayTitle';
import { getTrainerDisplayName } from '../../utils/displayName';
import { getTrainerDetailTabHref } from '../../utils/routes';
import { Link } from '@/i18n/navigation';

interface TrainerHeroProps {
  trainer: TrainerDetail;
}

function StarRating({ score }: { score: number }) {
  const fullStars = Math.floor(score);
  const hasHalf = score - fullStars >= 0.25;
  return (
    <div className="flex text-[#8A6D3B] text-[22px]">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={i} className="size-4 fill-current" />
      ))}
      {hasHalf && <StarHalf className="size-4 fill-current" />}
    </div>
  );
}

function formatViewCount(viewCount: number | undefined): string {
  if (!viewCount) return '0';
  return `${(viewCount / 1000).toFixed(1)}k+`;
}

export function TrainerHero({ trainer }: TrainerHeroProps) {
  const displayName = getTrainerDisplayName(trainer);
  const displayTitle =
    pickDisplayTitle(trainer.title, displayName)
    || plainIntroOrUndefined(trainer.oneLineIntro);
  const { requireAuth } = useAuthGuard();
  const [msgOpen, setMsgOpen] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const locationLabel = [trainer.provinceName, trainer.cityName].filter(Boolean).join(' ');

  useEffect(() => {
    getInteractionState('TRAINER', trainer.userId)
      .then((s) => setFavorited(s.favorited))
      .catch(() => {});
  }, [trainer.userId]);

  const toggleFavorite = useCallback(async () => {
    setFavLoading(true);
    try {
      if (favorited) {
        await removeFavorite('TRAINER', trainer.userId);
        setFavorited(false);
        toast.success('已取消收藏');
      } else {
        await addFavorite('TRAINER', trainer.userId);
        setFavorited(true);
        toast.success('收藏成功');
      }
    } catch {
      // 错误提示已在 apiClient 中弹出
    } finally {
      setFavLoading(false);
    }
  }, [favorited, trainer.userId]);

  return (
    <section className="relative z-10 w-full h-[322px] mb-6 flex flex-row overflow-hidden bg-white shadow-sm">
      {/* 左侧：固定宽红底 + 证件照 */}
      <div className="relative w-[339px] h-[322px] shrink-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(162.13deg, rgb(140, 20, 31) 0%, rgb(191, 31, 38) 38.9%, rgb(229, 33, 23) 70.7%)',
          }}
        />
        <Image
          src="/statics/images/trainer/hero-left-decor.png"
          alt=""
          fill
          unoptimized
          className="object-cover pointer-events-none select-none"
          aria-hidden
        />
        <div className="absolute left-[63px] top-[33px] w-[225px] h-[256px] border-[5px] border-white bg-slate-100 overflow-hidden">
          <SafeImage
            src={trainer.avatar}
            alt={displayName}
            width={225}
            height={256}
            apiResolved
            className="w-full h-full object-cover"
          />
        </div>
        {trainer.isTrusted === 1 && (
          <Image
            src="/statics/images/icons/trusted-xin.png"
            alt="信得过"
            width={60}
            height={60}
            className="absolute left-[269px] top-[253px] w-[60px] h-[60px] object-contain drop-shadow-md pointer-events-none select-none"
          />
        )}
      </div>

      {/* 右侧：信息区（随屏变宽） */}
      <div className="relative flex-1 min-w-0 h-[322px] bg-white overflow-hidden">
        <Image
          src="/statics/images/trainer/hero-taoke-watermark.png"
          alt=""
          width={393}
          height={141}
          unoptimized
          className="absolute left-[141px] top-[93px] w-[393px] h-auto opacity-[0.05] pointer-events-none select-none"
          aria-hidden
        />

        {/* 右上操作 */}
        <div className="absolute right-[24px] top-[40px] flex flex-col items-end gap-2 z-10">
          <div className="flex items-center gap-[7px]">
            <button
              type="button"
              disabled={favLoading}
              onClick={() => requireAuth(toggleFavorite)}
              className={`flex items-center gap-[5px] h-[25px] w-[68px] justify-center rounded border border-[#bfbfbf] bg-[#f4f7fe] text-[13.5px] font-semibold ${
                favorited ? 'text-primary border-primary' : 'text-[#979fac]'
              }`}
            >
              <Heart className={`size-3 ${favorited ? 'fill-primary text-primary' : ''}`} />
              {favorited ? '已收藏' : '收藏'}
            </button>
            <Link
              href={getTrainerDetailTabHref(trainer.id, 'comments')}
              className="flex items-center gap-[5px] h-[25px] w-[68px] justify-center rounded border border-[#bfbfbf] bg-[#f4f7fe] text-[13.5px] font-semibold text-[#979fac]"
            >
              <Image
                src="/statics/images/icons/trainer-hero-review.png"
                alt=""
                width={10}
                height={10}
                unoptimized
                className="size-2.5 object-contain"
              />
              评价
            </Link>
            <button
              type="button"
              className="flex items-center gap-[5px] h-[25px] w-[68px] justify-center rounded border border-[#bfbfbf] bg-[#f4f7fe] text-[13.5px] font-semibold text-[#979fac]"
            >
              <Image
                src="/statics/images/icons/trainer-hero-contact.png"
                alt=""
                width={10}
                height={10}
                unoptimized
                className="size-2.5 object-contain"
              />
              联系
            </button>
          </div>
          <button
            type="button"
            className="h-[25px] w-[79px] rounded border border-[#bfbfbf] text-[13.5px] font-medium text-[#979fac]"
          >
            下载简历
          </button>
        </div>

        {/* 主信息 */}
        <div className="relative z-[1] flex h-full flex-col pl-6 pr-[240px] pt-9 pb-5">
          <div className="flex items-baseline gap-3 min-w-0">
            <h1 className="text-[30px] font-bold leading-none text-[#0f172b] shrink-0 tracking-tight">
              {displayName}
            </h1>
            {displayTitle ? (
              <span
                className="text-[12.5px] text-[#c24848] px-3 py-1 truncate max-w-[360px]"
                style={{
                  backgroundImage:
                    'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,151,136,0.4) 20%, rgba(255,185,162,0.7) 50%, rgba(255,151,136,0.4) 80%, rgba(255,255,255,0) 100%)',
                }}
              >
                {displayTitle}
              </span>
            ) : null}
          </div>

          {locationLabel ? (
            <div className="mt-4 flex items-center gap-1.5 text-[10px] text-[#62748e]">
              <span className="font-medium">专家驻地：</span>
              <MapPin className="size-3 text-slate-400 shrink-0" />
              <span className="text-[#3f4753]">{locationLabel}</span>
            </div>
          ) : null}

          <div className="mt-3 space-y-2.5">
            {(trainer.expertiseCategories?.length ?? 0) > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#62748e] font-medium shrink-0 w-[60px]">
                  擅长领域：
                </span>
                <div className="flex flex-wrap gap-3.5">
                  {trainer.expertiseCategories.map((cat) => (
                    <span
                      key={cat.categoryId}
                      className="h-[23px] inline-flex items-center px-3 rounded-full border border-[#be0202] text-[10px] font-medium text-[#c31313] bg-white/20"
                    >
                      {cat.categoryName}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(trainer.industryCategories?.length ?? 0) > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#62748e] font-medium shrink-0 w-[60px]">
                  擅长行业：
                </span>
                <div className="flex flex-wrap gap-3.5">
                  {trainer.industryCategories.map((cat) => (
                    <span
                      key={cat.categoryId}
                      className="h-[23px] inline-flex items-center px-3 rounded-full border border-[#be0202] text-[10px] font-medium text-[#c31313] bg-white/20"
                    >
                      {cat.categoryName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto flex items-end justify-between gap-6 pt-3">
            <div className="bg-[rgba(245,246,248,0.92)] rounded-[13.5px] h-[80px] w-[327px] shrink-0 flex items-center justify-around px-4">
              <div className="flex flex-col items-center min-w-[54px]">
                {trainer.score != null && trainer.score > 0 ? (
                  <>
                    <StarRating score={trainer.score} />
                    <span className="text-[#002B5B] font-bold text-[16px] mt-1">
                      {trainer.score.toFixed(1)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[#313a47] font-semibold text-[13.5px]">暂无评分</span>
                    <span className="text-[#a8a8a8] font-bold text-[22.5px] leading-none mt-1">—</span>
                  </>
                )}
              </div>
              <div className="flex flex-col items-center min-w-[54px]">
                <span className="text-[#313a47] font-semibold text-[13.5px]">累计咨询</span>
                <span className="text-[red] font-bold text-[17px] mt-1.5 leading-none">
                  {trainer.consultationCount || 0}
                </span>
              </div>
              <div className="flex flex-col items-center min-w-[54px]">
                <span className="text-[#313a47] font-semibold text-[13.5px]">累计曝光</span>
                <span className="text-[red] font-bold text-[17px] mt-1.5 leading-none">
                  {formatViewCount(trainer.viewCount)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => requireAuth(() => setMsgOpen(true))}
              className="h-[52px] w-[194px] shrink-0 rounded bg-[#be0000] text-white text-[13.5px] font-semibold flex items-center justify-center gap-2.5 hover:bg-[#be0000]/90"
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
}
```

- [ ] **Step 2: 确认无旧文案残留**

```powershell
Select-String -Path "frontend/src/features/trainer/components/detail/TrainerHero.tsx" -Pattern "加入对比|收藏讲师|flex-col xl:flex-row"
```

Expected: 无匹配。

- [ ] **Step 3: 开发服务器目视对照 Figma `17:4`**

检查清单：

1. 高约 322px，左 339px 红饰、右白区拉满  
2. 无「加入对比」；有收藏 / 评价 / 联系 / 下载简历 / 给专家留言  
3. 评价跳到 `/trainer/{id}/comment.htm`  
4. 联系、下载简历点击无跳转、无 toast  
5. 收藏 / 留言仍可用  
6. 缩窄窗口：整页横滚，Hero 不上下堆叠  
7. 水印可见但很淡；红底平行四边形与稿一致  

若左侧装饰叠层与证件照错位：只调 `left/top/width/height`（Figma：照 `63/33/225/256`，章 `269/253/60`），不要改回响应式。

若水印太深/太浅：只改 `opacity-[0.05]`（可试 `0.04`–`0.08`），颜色以资源本身为准。

- [ ] **Step 4: 跑路由单测回归**

```bash
cd frontend
pnpm test -- src/features/trainer/utils/routes.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/trainer/components/detail/TrainerHero.tsx
git -c user.name="雷宗翰" -c user.email="leizonghan@taoke.com" commit -m "feat(frontend): redesign TrainerHero to Figma fig.1 fixed layout"
```

---

### Task 6: 收尾核对

**Files:**（只读验收，无代码则跳过 commit）

- [ ] **Step 1: 对照 spec 验收表**

打开 [`2026-07-14-trainer-hero-redesign-design.md`](../specs/2026-07-14-trainer-hero-redesign-design.md) §8，逐项勾过。

- [ ] **Step 2: 确认未误改**

```powershell
git status -sb
```

Expected: 不应包含 `frontend/.env.local`；不应引入抠图分支或「加入对比」。

- [ ] **Step 3:（可选）若 Task 5 有微调像素，再 commit 一次**

```bash
git add frontend/src/features/trainer/components/detail/TrainerHero.tsx
git -c user.name="雷宗翰" -c user.email="leizonghan@taoke.com" commit -m "fix(frontend): pixel-tune TrainerHero against Figma"
```

---

## Spec 覆盖自检

| Spec 要求 | 对应 Task |
|-----------|-----------|
| 图1 / 不抠图 / 高 322 / 左固定右拉宽 | Task 5 |
| 浏览器 100% 宽通栏 | Task 4 + 5 |
| 窄屏横向滚动、不改排 | Task 3 + 5（无 flex-col 断点） |
| 去掉加入对比；Figma 操作区 | Task 5 |
| 评价 → 学员评价 Tab | Task 2 + 5 |
| 联系 / 下载简历仅 UI | Task 5 |
| 红底+平行四边形一比一 | Task 1（Figma 导出）+ Task 5 |
| 用户 Logo 水印 | Task 1 + 5 |
| 专家编号 / 签约角标本期不展示 | Task 5（未渲染） |
| 公共 min-width 接线；PXB 不动 | Task 3 |
| 正文可仍限宽 | Task 4 |

**未纳入计划（与 spec 一致）：** 图2 抠图；联系/简历真实业务；全站清断点。
`}