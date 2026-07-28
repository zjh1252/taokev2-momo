# Task 4 Report: 专家详情 Tab / 评价滚动（#10、#11）

## Status
**Done**

## Changes
- `frontend/src/features/trainer/components/detail/TrainerDetailContent.tsx`
  - 内容区根容器增加 `id="trainer-detail-tab-panel"`、`scroll-mt-[120px]`
  - `activeTab` 变化时（非 `comments`）对 panel 执行 `scrollIntoView({ behavior: 'smooth', block: 'start' })`
  - `comments` Tab 跳过 panel 滚动，避免与 CTA 居中冲突
  - 「我要评价」按钮增加 `id="trainer-review-cta"`
  - `ReviewsView` 挂载时计算 CTA 视口垂直居中，`headerOffset=120` 保底不遮挡

## Commit
- `539283c6` — `fix(frontend): 专家详情 Tab 滚动避让顶栏并居中评价按钮`

## Test Summary
- IDE linter：本文件无新增诊断
- `pnpm lint`：项目存在既有 warning/error（含本文件 L658 既有 `setState in effect`，非本次引入）
- 未跑浏览器手工验收（需本地打开 `/trainer/{id}.htm` 与 `/trainer/{id}/comment.htm`）

## Concerns
- `120px` 为估算值；若 sticky 顶栏+Tab 实际更高，可微调 `scroll-mt-[120px]` 与 `TRAINER_DETAIL_HEADER_OFFSET`
- 评价 Tab 的 CTA 滚动在 `ReviewsView` mount 时触发；若未来该视图延迟渲染，需改为 `loaded` 后滚动

## Manual QA Checklist
- [ ] 各 Tab 切换：内容顶部不被顶栏遮挡，URL/下划线正确
- [ ] `/comment.htm`：「我要评价」约在视口垂直中线
- [ ] 快速连点 Tab：smooth scroll 可被后续点击打断
