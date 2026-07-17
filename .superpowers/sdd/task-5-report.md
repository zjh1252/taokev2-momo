# Task 5 Report: `includeCourse` 按需 enrich 与缓存隔离

## Status
**Complete**

## Changes
- `TrainerService.listPublic`、实现类与公开 Controller 新增 `includeCourse` 参数，HTTP 默认 `false`。
- `TrainerServiceImpl` 仅在 `includeCourse=true` 时调用 `TrainerListItemEnricher`。
- 专家默认列表缓存读写 key 增加 `:c0` / `:c1`，失效时同时清除两类 key。
- `TrainerListParams` 移至公共 `types.ts` 并新增 `includeCourse?: boolean`。
- `getTrainerList` 仅在显式传入 `true` 时发送 `includeCourse=true`。
- PXB 的 `pxbTrainerListParams` 固定传入 `includeCourse: true`。
- 已搜索全部 Java `listPublic` 调用；专家服务仅由 `TrainerController` 调用并已更新。

## Commit
`perf: skip trainer list course enrich unless includeCourse`

## Test Summary
- `cd backend && mvn -pl taoke-user,taoke-app -am compile -q`：通过（exit 0）。
- IDE scoped lint：无错误。
- `pnpm exec tsc --noEmit`：未执行成功；该 worktree 未安装 `node_modules`，找不到 `tsc`。

## Concerns
- 前端完整类型检查需在安装依赖后补跑。

## Report Path
`.superpowers/sdd/task-5-report.md`
