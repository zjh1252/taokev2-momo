# Task 8 Report — 专家角标对齐优质口径（§72）

## Changes
1. **Badge OR condition** — `TrainerCard`, `TrainerHero`, `PxbTrainerListItem`: `isTrusted === 1 || isSigned === 1`
2. **List VO** — `TrainerListItem` type + `TrainerListItemResponse` add `isSigned` (MapStruct auto-maps; ServiceImpl/filter untouched)
3. **Filter persistence** — `TrainerListSection` reviewed: `trustedOnly` → `isTrusted: 1` in `fetchData`; preserved on page/sort via `filters` state; reset clears. **No fix needed.**

## Verification
- Linter: no issues on changed TSX files
- `TrainerServiceImpl` OR filter: unchanged

## Manual QA (deferred)
- [ ] 勾选信得过：各页结果均有「信」标（含仅签约讲师）
- [ ] 切换排序后筛选仍生效
- [ ] 重置恢复全量

## Status
**DONE** — code committed; browser smoke pending human QA
