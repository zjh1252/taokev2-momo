# Task 2 Report: 首页专家大卡简介铺满（#5）

**Status:** DONE

**Commit:** `a321c831` — fix(frontend): 首页推荐专家大卡简介铺满可用高度

## Changes

### MainExpertCard — `frontend/src/features/home/components/ExpertsSection.tsx`

- bio 段落：移除 `line-clamp-6`，新增 `flex-1 min-h-0 overflow-hidden`，使简介占满姓名/副标题与底部标签区之间的可用垂直空间
- 底部操作区（标签 + CTA）：新增 `shrink-0`，配合既有 `mt-auto` 固定在卡片底部
- 模块外层 `md:h-[500px]` 未改动；`MiddleExpertCard` / `SideExpertCard` 未改动

## Verification

| Check | Result |
|-------|--------|
| `pnpm lint` | Exit 1 — 仓库既有历史错误；**未涉及** `ExpertsSection.tsx` |
| 浏览器手工验收 | 未执行（无本地 dev server） |

## Self-Review

- 改动范围严格限定 `MainExpertCard` 文本区，与 brief 提供的 JSX 一致。
- flex 布局链完整：Link `h-full` → 右侧文案区 `flex flex-col flex-1 min-h-0` → bio `flex-1` → 底部 `mt-auto shrink-0`，可在固定 500px 高度内撑满空白。
- bio 使用 `overflow-hidden` 而非 line-clamp，超长文本会被裁切而非显示省略号；符合 brief「铺满可用高度」意图。

## Concerns

- 无功能性顾虑。浏览器视觉验收需人工在首页确认简介是否填满红圈空白区域。
