# 培训合伙人审核状态面板 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按 Figma 还原培训合伙人「审核中 / 已通过」状态面板；提供预览路由；真实页按申请状态分支（未申请仍为协议表单）。

**Architecture:** 抽出纯函数状态适配层 + 纯 UI `PartnerStatusPanel`；协议表单抽出为 `PartnerApplyForm`；真实页与预览页共用壳与面板。预览只读 `?status=`，不碰适配层。静态印章资源落入 `public`，禁止运行时依赖 Figma MCP 临时 URL。

**Tech Stack:** Next.js App Router（client pages）、React 19、Tailwind、vitest、`ROUTES`、`useSearchParams`

**Spec:** [`docs/superpowers/specs/2026-07-14-partner-status-panel-design.md`](../specs/2026-07-14-partner-status-panel-design.md)

**Figma:** file `oH4ffDnHm2XLhgwLzXKyOw` — pending `31:609` / stamp group `26:403`；approved `31:608` / stamp group `29:515`

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `frontend/src/features/alliance/types.ts` | 状态与返回值类型 |
| `frontend/src/features/alliance/partner-application.ts` | `getPartnerApplicationStatus`、`parsePartnerPreviewStatus`、预览示例编号常量 |
| `frontend/src/features/alliance/partner-application.test.ts` | 适配层 / 解析纯函数单测 |
| `frontend/src/features/alliance/components/PartnerStatusPanel.tsx` | 审核中 / 已通过面板 UI |
| `frontend/src/features/alliance/components/PartnerApplyForm.tsx` | 现有协议 + 表单（从 page 抽出，交互不改） |
| `frontend/src/features/alliance/components/PartnerPageShell.tsx` | 顶栏「培训合伙人」+ 白卡片壳 |
| `frontend/public/statics/images/alliance/partner-stamp-pending.png` | 「审批中」印章（本地静态） |
| `frontend/public/statics/images/alliance/partner-stamp-approved.png` | 「已通过」印章（本地静态） |
| `frontend/src/app/[locale]/(usercenter)/dashboard/alliance/partner/page.tsx` | 真实页分支 |
| `frontend/src/app/[locale]/(usercenter)/dashboard/alliance/partner/preview/page.tsx` | 预览页 |
| `frontend/src/config/routes.ts` | 可选：`UC_ALLIANCE_PARTNER_PREVIEW` |

侧栏仍链到 `UC_ALLIANCE_PARTNER`；预览路由不进侧栏。

---

### Task 1: 类型 + 状态纯函数（TDD）

**Files:**
- Create: `frontend/src/features/alliance/types.ts`
- Create: `frontend/src/features/alliance/partner-application.ts`
- Create: `frontend/src/features/alliance/partner-application.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it, afterEach } from 'vitest';
import {
  PREVIEW_PARTNER_CODE,
  getPartnerApplicationStatus,
  parsePartnerPreviewStatus,
} from './partner-application';

describe('parsePartnerPreviewStatus', () => {
  it('accepts pending and approved case-insensitively', () => {
    expect(parsePartnerPreviewStatus('pending')).toBe('pending');
    expect(parsePartnerPreviewStatus('APPROVED')).toBe('approved');
    expect(parsePartnerPreviewStatus('Approved')).toBe('approved');
  });

  it('falls back to pending for missing or invalid values', () => {
    expect(parsePartnerPreviewStatus(null)).toBe('pending');
    expect(parsePartnerPreviewStatus(undefined)).toBe('pending');
    expect(parsePartnerPreviewStatus('')).toBe('pending');
    expect(parsePartnerPreviewStatus('rejected')).toBe('pending');
    expect(parsePartnerPreviewStatus('foo')).toBe('pending');
  });
});

describe('getPartnerApplicationStatus', () => {
  const original = process.env.NEXT_PUBLIC_PARTNER_STATUS_MOCK;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_PARTNER_STATUS_MOCK;
    } else {
      process.env.NEXT_PUBLIC_PARTNER_STATUS_MOCK = original;
    }
  });

  it('defaults to none when mock unset', () => {
    delete process.env.NEXT_PUBLIC_PARTNER_STATUS_MOCK;
    expect(getPartnerApplicationStatus()).toEqual({ status: 'none' });
  });

  it('returns pending + code when mock is pending', () => {
    process.env.NEXT_PUBLIC_PARTNER_STATUS_MOCK = 'pending';
    expect(getPartnerApplicationStatus()).toEqual({
      status: 'pending',
      partnerCode: PREVIEW_PARTNER_CODE,
    });
  });

  it('returns approved + code when mock is approved', () => {
    process.env.NEXT_PUBLIC_PARTNER_STATUS_MOCK = 'approved';
    expect(getPartnerApplicationStatus()).toEqual({
      status: 'approved',
      partnerCode: PREVIEW_PARTNER_CODE,
    });
  });

  it('treats rejected mock as none for UI branching this phase', () => {
    process.env.NEXT_PUBLIC_PARTNER_STATUS_MOCK = 'rejected';
    expect(getPartnerApplicationStatus()).toEqual({ status: 'none' });
  });
});
```

- [ ] **Step 2: 跑测确认失败**

```bash
cd d:\leizonghan\taokev2-mono\frontend
pnpm exec vitest run src/features/alliance/partner-application.test.ts
```

Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现类型与纯函数**

`frontend/src/features/alliance/types.ts`:

```ts
export type PartnerApplicationStatus =
  | 'none'
  | 'pending'
  | 'approved'
  | 'rejected';

export type PartnerPanelStatus = 'pending' | 'approved';

export type PartnerApplicationSnapshot = {
  status: PartnerApplicationStatus;
  partnerCode?: string;
};
```

`frontend/src/features/alliance/partner-application.ts`:

```ts
import type {
  PartnerApplicationSnapshot,
  PartnerPanelStatus,
} from './types';

/** Figma 示例编号；预览与 mock 共用 */
export const PREVIEW_PARTNER_CODE = 'TPC_20260714134819240966';

/**
 * 解析预览 query。非法 / 缺省 → pending。
 */
export function parsePartnerPreviewStatus(
  raw: string | null | undefined,
): PartnerPanelStatus {
  const v = (raw ?? '').trim().toLowerCase();
  if (v === 'approved') return 'approved';
  if (v === 'pending') return 'pending';
  return 'pending';
}

/**
 * 真实页申请状态适配层。
 * 本期无 API：默认 none；可用 NEXT_PUBLIC_PARTNER_STATUS_MOCK=pending|approved 联调。
 * rejected mock 本期按 none 返回（仍显示表单），与 design spec 一致。
 */
export function getPartnerApplicationStatus(): PartnerApplicationSnapshot {
  const mock = (process.env.NEXT_PUBLIC_PARTNER_STATUS_MOCK ?? '')
    .trim()
    .toLowerCase();
  if (mock === 'pending') {
    return { status: 'pending', partnerCode: PREVIEW_PARTNER_CODE };
  }
  if (mock === 'approved') {
    return { status: 'approved', partnerCode: PREVIEW_PARTNER_CODE };
  }
  // rejected 及其它 → none
  return { status: 'none' };
}

/** 真实页是否应渲染状态面板 */
export function shouldShowPartnerStatusPanel(
  status: PartnerApplicationSnapshot['status'],
): status is PartnerPanelStatus {
  return status === 'pending' || status === 'approved';
}
```

- [ ] **Step 4: 跑测确认通过**

```bash
cd d:\leizonghan\taokev2-mono\frontend
pnpm exec vitest run src/features/alliance/partner-application.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd d:\leizonghan\taokev2-mono
git add frontend/src/features/alliance/types.ts frontend/src/features/alliance/partner-application.ts frontend/src/features/alliance/partner-application.test.ts
git commit -m "feat(frontend): add partner application status helpers"
```

---

### Task 2: 导出印章静态资源

**Files:**
- Create: `frontend/public/statics/images/alliance/partner-stamp-pending.png`
- Create: `frontend/public/statics/images/alliance/partner-stamp-approved.png`

- [ ] **Step 1: 从 Figma 拉印章节点截图 URL 并下载到本地**

对 stamp 节点调用 Figma MCP `get_screenshot`（`enableBase64Response` 仅在无法 curl 时用）：

- pending stamp：`fileKey=oH4ffDnHm2XLhgwLzXKyOw`，`nodeId=26:403`
- approved stamp：`fileKey=oH4ffDnHm2XLhgwLzXKyOw`，`nodeId=29:515`

用返回的短时 URL（或 base64）写入文件。PowerShell 示例（URL 替换为当次 MCP 返回值）：

```powershell
cd d:\leizonghan\taokev2-mono
New-Item -ItemType Directory -Force -Path frontend\public\statics\images\alliance | Out-Null
# 将 $pendingUrl / $approvedUrl 换为 get_screenshot 返回的 PNG URL
Invoke-WebRequest -Uri $pendingUrl -OutFile frontend\public\statics\images\alliance\partner-stamp-pending.png
Invoke-WebRequest -Uri $approvedUrl -OutFile frontend\public\statics\images\alliance\partner-stamp-approved.png
```

验收：两文件存在且 `Get-Item ... | Select-Object Length` 均 > 1KB；用看图软件确认是圆章而非整页。

禁止：组件里硬编码 `https://www.figma.com/api/mcp/asset/...`。

若 MCP URL 过期：重新 `get_screenshot` 再下，不要跳过成本地空文件。

- [ ] **Step 2: Commit**

```bash
cd d:\leizonghan\taokev2-mono
git add frontend/public/statics/images/alliance/partner-stamp-pending.png frontend/public/statics/images/alliance/partner-stamp-approved.png
git commit -m "assets(frontend): add partner status stamp images"
```

---

### Task 3: PartnerStatusPanel UI

**Files:**
- Create: `frontend/src/features/alliance/components/PartnerStatusPanel.tsx`

- [ ] **Step 1: 实现面板组件**

按 spec / Figma 还原结构：居中标题 → 分隔线 → 正文 → 编号行；右下印章图；底部大号半透明 TAOKE 水印（CSS 文字即可，配弱标识可用印章旁留空）。相对定位，不照搬绝对像素。

```tsx
'use client';

import type { PartnerPanelStatus } from '../types';

const COPY = {
  pending: {
    title: '培训合伙人申请审核中',
    body: '您的申请资料已成功提交。工作人员将在1-3个工作日内完成您的审核。审核结果将通过站内消息通知您。',
    stampSrc: '/statics/images/alliance/partner-stamp-pending.png',
    stampAlt: '审批中',
    // 底 / 字 / 线
    panelBg: 'bg-[#fff8e8]',
    titleClass: 'text-[#a46732]',
    textClass: 'text-[#973c00]',
    lineClass: 'border-[#d4a574]/
    watermarkClass: 'text-[rgba(255,241,201,0.62)]',
  },
  approved: {
    title: '培训合伙人申请已通过',
    body: '恭喜您已通过培训合伙人审核。',
    stampSrc: '/statics/images/alliance/partner-stamp-approved.png',
    stampAlt: '已通过',
    panelBg: 'bg-[#eefaf0]',
    titleClass: 'text-[#1c7b19]',
    textClass: 'text-[#195e0e]',
    lineClass: 'border-[#8fd49a]',
    watermarkClass: 'text-[rgba(210,255,213,0.62)]',
  },
} as const;

export type PartnerStatusPanelProps = {
  status: PartnerPanelStatus;
  partnerCode: string;
};

/**
 * 培训合伙人申请结果态（审核中 / 已通过），对齐 Figma 31:609 / 31:608。
 */
export function PartnerStatusPanel({
  status,
  partnerCode,
}: PartnerStatusPanelProps) {
  const c = COPY[status];

  return (
    <div
      className={`relative min-h-[560px] overflow-hidden ${c.panelBg}`}
    >
      {/* 水印 */}
      <div
        className={`pointer-events-none absolute bottom-8 left-8 select-none font-bold text-[120px] leading-none md:text-[160px] ${c.watermarkClass}`}
        aria-hidden
      >
        TAOKE
      </div>

      <div className="relative z-[1] mx-auto flex max-w-3xl flex-col items-center px-8 pb-28 pt-14 text-center">
        <h1 className={`text-3xl font-bold md:text-[40px] ${c.titleClass}`}>
          {c.title}
        </h1>
        <div
          className={`mt-6 h-px w-full max-w-xl border-t ${c.lineClass}`}
        />
        <p
          className={`mt-10 max-w-2xl text-lg leading-relaxed md:text-[26px] md:leading-[1.8] ${c.textClass}`}
        >
          {c.body}
        </p>
        <p className={`mt-10 text-base md:text-[22px] ${c.textClass}`}>
          <span className="font-normal">培训合伙人编号：</span>
          <span className="font-bold">{partnerCode}</span>
        </p>
      </div>

      {/* 印章 */}
      <img
        src={c.stampSrc}
        alt={c.stampAlt}
        className="pointer-events-none absolute bottom-10 right-10 z-[2] w-[200px] md:w-[260px] select-none"
      />
    </div>
  );
}
```

实现时可根据 Figma 微调间距 / 字号；**不得**引入临时 MCP asset URL。颜色以表为准。

- [ ] **Step 2: 类型检查抽查**

```bash
cd d:\leizonghan\taokev2-mono\frontend
pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | Select-String -Pattern "alliance|PartnerStatus" | Select-Object -First 20
```

Expected: 无 alliance / PartnerStatus 相关报错。

- [ ] **Step 3: Commit**

```bash
cd d:\leizonghan\taokev2-mono
git add frontend/src/features/alliance/components/PartnerStatusPanel.tsx
git commit -m "feat(frontend): add PartnerStatusPanel for pending/approved"
```

---

### Task 4: 抽出壳与申请表单

**Files:**
- Create: `frontend/src/features/alliance/components/PartnerPageShell.tsx`
- Create: `frontend/src/features/alliance/components/PartnerApplyForm.tsx`
- Modify: `frontend/src/app/[locale]/(usercenter)/dashboard/alliance/partner/page.tsx`（本 Task 仅抽出；分支接线在 Task 5）

- [ ] **Step 1: PartnerPageShell**

```tsx
'use client';

import type { ReactNode } from 'react';

export function PartnerPageShell({ children }: { children: ReactNode }) {
  return (
    <section className="min-h-[500px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h2 className="font-bold text-gray-800">培训合伙人</h2>
      </div>
      {children}
    </section>
  );
}
```

- [ ] **Step 2: 把现有 page 正文迁到 PartnerApplyForm**

将当前 `partner/page.tsx` 里「协议标题 → 甲乙方 → 滚动协议 → 表单 → 申请按钮」整块剪切到：

`frontend/src/features/alliance/components/PartnerApplyForm.tsx`

外层用：

```tsx
'use client';

export function PartnerApplyForm() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center p-8">
      {/* 原 page 内容，一字不改交互 */}
    </div>
  );
}
```

暂把 `page.tsx` 改成：

```tsx
'use client';

import { PartnerApplyForm } from '@/features/alliance/components/PartnerApplyForm';
import { PartnerPageShell } from '@/features/alliance/components/PartnerPageShell';

export default function PartnerPage() {
  return (
    <PartnerPageShell>
      <PartnerApplyForm />
    </PartnerPageShell>
  );
}
```

目视：真实页仍与改前一致（协议 + 表单）。

- [ ] **Step 3: Commit**

```bash
cd d:\leizonghan\taokev2-mono
git add frontend/src/features/alliance/components/PartnerPageShell.tsx frontend/src/features/alliance/components/PartnerApplyForm.tsx "frontend/src/app/[locale]/(usercenter)/dashboard/alliance/partner/page.tsx"
git commit -m "refactor(frontend): extract partner shell and apply form"
```

---

### Task 5: 真实页按状态分支

**Files:**
- Modify: `frontend/src/app/[locale]/(usercenter)/dashboard/alliance/partner/page.tsx`

- [ ] **Step 1: 接线适配层**

```tsx
'use client';

import { PartnerApplyForm } from '@/features/alliance/components/PartnerApplyForm';
import { PartnerPageShell } from '@/features/alliance/components/PartnerPageShell';
import { PartnerStatusPanel } from '@/features/alliance/components/PartnerStatusPanel';
import {
  getPartnerApplicationStatus,
  shouldShowPartnerStatusPanel,
} from '@/features/alliance/partner-application';

export default function PartnerPage() {
  const snapshot = getPartnerApplicationStatus();

  return (
    <PartnerPageShell>
      {shouldShowPartnerStatusPanel(snapshot.status) ? (
        <PartnerStatusPanel
          status={snapshot.status}
          partnerCode={snapshot.partnerCode ?? ''}
        />
      ) : (
        <PartnerApplyForm />
      )}
    </PartnerPageShell>
  );
}
```

默认（无 env）：仍为表单。本地联调真实页状态时，在 `frontend/.env.local` 临时加：

```
NEXT_PUBLIC_PARTNER_STATUS_MOCK=pending
```

或 `approved`；改完重启 `pnpm dev`。**不要把含个人密钥的 `.env.local` 提交进 git**；若仅加上述一行 mock 键，也勿 commit `.env.local`。

- [ ] **Step 2: Commit**

```bash
cd d:\leizonghan\taokev2-mono
git add "frontend/src/app/[locale]/(usercenter)/dashboard/alliance/partner/page.tsx"
git commit -m "feat(frontend): branch partner page by application status"
```

---

### Task 6: 预览路由

**Files:**
- Create: `frontend/src/app/[locale]/(usercenter)/dashboard/alliance/partner/preview/page.tsx`
- Modify: `frontend/src/config/routes.ts`（增加常量，可选但推荐）

- [ ] **Step 1: 增加路由常量**

在 `ROUTES` 中 `UC_ALLIANCE_PARTNER` 旁增加：

```ts
  UC_ALLIANCE_PARTNER: '/dashboard/alliance/partner',
  UC_ALLIANCE_PARTNER_PREVIEW: '/dashboard/alliance/partner/preview',
```

- [ ] **Step 2: 创建预览页**

```tsx
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PartnerPageShell } from '@/features/alliance/components/PartnerPageShell';
import { PartnerStatusPanel } from '@/features/alliance/components/PartnerStatusPanel';
import {
  PREVIEW_PARTNER_CODE,
  parsePartnerPreviewStatus,
} from '@/features/alliance/partner-application';

function PartnerPreviewInner() {
  const searchParams = useSearchParams();
  const status = parsePartnerPreviewStatus(searchParams.get('status'));

  return (
    <PartnerPageShell>
      <PartnerStatusPanel
        status={status}
        partnerCode={PREVIEW_PARTNER_CODE}
      />
    </PartnerPageShell>
  );
}

/**
 * 培训合伙人状态预览 — 不读真实申请数据，仅 ?status=pending|approved。
 */
export default function PartnerPreviewPage() {
  return (
    <Suspense
      fallback={
        <PartnerPageShell>
          <div className="min-h-[400px] bg-[#fff8e8]" />
        </PartnerPageShell>
      }
    >
      <PartnerPreviewInner />
    </Suspense>
  );
}
```

注意：该路径在 `(usercenter)/dashboard` 下，仍受 `DashboardAuthGuard` 保护，需登录后访问。

- [ ] **Step 3: 本地冒烟**

```bash
cd d:\leizonghan\taokev2-mono\frontend
pnpm exec vitest run src/features/alliance/partner-application.test.ts
```

Expected: PASS

目视（需已登录用户中心，locale 前缀按项目惯例，常见为无前缀或 `/zh`）：

- `http://localhost:3000/dashboard/alliance/partner/preview?status=pending`
- `http://localhost:3000/dashboard/alliance/partner/preview?status=approved`
- `http://localhost:3000/dashboard/alliance/partner/preview?status=foo` → 应等同 pending
- `http://localhost:3000/dashboard/alliance/partner` → 无 mock 时为表单

若项目带 locale 前缀，改为 `http://localhost:3000/zh/dashboard/...`（与现网其它 dashboard 路径一致）。

对照 Figma：底色、标题、正文、编号、水印、印章位置与色相。

- [ ] **Step 4: Commit**

```bash
cd d:\leizonghan\taokev2-mono
git add "frontend/src/app/[locale]/(usercenter)/dashboard/alliance/partner/preview/page.tsx" frontend/src/config/routes.ts
git commit -m "feat(frontend): add partner status preview routes"
```

---

## 验收清单（对照 spec §7）

| # | 标准 | 覆盖 Task |
|---|------|-----------|
| 1 | 预览两 URL 视觉对齐 Figma | 2, 3, 6 |
| 2 | 真实页 none=表单；mock 后与预览同组件 | 1, 4, 5 |
| 3 | 非法 query 兜底 pending | 1, 6 |
| 4 | 无运行时 MCP asset URL | 2, 3 |
| 5 | 无驳回专属 UI；不改申请提交流程 | 4, 5 |

---

## Spec 覆盖自检

| Spec 节 | Plan 任务 |
|---------|-----------|
| §4 状态分支 / 预览规则 | Task 1, 5, 6 |
| §5 视觉文案 / 本地资源 | Task 2, 3 |
| §6 组件与适配层 | Task 1, 3, 4, 5, 6 |
| §7 验收 | 上表 + Task 6 Step 3 |
| §8 后续（驳回 API 提交） | 明确不在本期 |

无 TBD /「类似 Task N」占位；类型名 `PartnerPanelStatus` / `PREVIEW_PARTNER_CODE` / `parsePartnerPreviewStatus` 全文一致。
