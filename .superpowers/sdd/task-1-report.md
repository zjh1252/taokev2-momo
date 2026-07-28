# Task 1 Report: 专家筛选点选关浮层 + 常驻城市文案（#3、#6）

**Status:** DONE

**Commit:** `6e9e3ddf` — fix(frontend): 专家筛选点选关浮层并统一常驻城市文案

## Changes

### 1. i18n — `frontend/src/messages/zh-CN/trainer.json`

- `"city": "常驻省市"` → `"city": "常驻城市"`

### 2. TrainerFilters — `frontend/src/features/trainer/components/list/TrainerFilters.tsx`

- `FILTER_ITEMS` province label: `'长驻省市'` → `'常驻城市'`
- JSDoc / interface comments: 「长驻省市」→「常驻城市」（`regionName`、`provinceId` 参数名未改）
- 新增 `closeFlyout = () => setActiveFilter(null)`
- 三个 pick handler 末尾调用 `closeFlyout()`：
  - `handleExpertisePick`
  - `handleIndustryPick`
  - `handleProvincePick`

## Verification

| Check | Result |
|-------|--------|
| `pnpm lint` | Exit 1 — 仓库既有 60 errors / 178 warnings；**未涉及**本次修改的两个文件 |
| 浏览器手工验收 | 未执行（无本地 dev server） |

## Self-Review

- 范围符合 brief：仅专家列表筛选侧栏 + zh-CN 文案，未动 OpenCourse 多选、未改后端参数。
- `closeFlyout` 在 `onChange` 之后调用，筛选值先更新再关浮层，行为与需求一致。
- 侧栏硬编码 label 与 i18n `trainer.filters.city` 均已统一为「常驻城市」。

## Concerns

- 无功能性顾虑。Lint 全量失败为历史债务，与本次改动无关。
