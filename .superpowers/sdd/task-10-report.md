# Task 10 Report: 内训详情/列表价格 UI（75）

**日期**: 2026-08-07  
**状态**: ✅ 完成

## 改动摘要

| 文件 | 改动 |
|------|------|
| `CourseSidebar.tsx` | 内训课 sticky 卡片顶部新增「培训参考价」三态（免费 / ¥金额+可选划线原价 / 待定），样式对齐公开课价区 |
| `InnerCourseCard.tsx` | 信息区新增「参考价」行，同三态逻辑 |
| `CourseHero.tsx` | 未改；免费标仍 `isFree === 1` |

## 三态规则

- `isFree === 1` → 免费
- `price > 0` → `¥{price}`（侧栏在 `originalPrice > price` 时展示划线原价）
- 否则 → 待定

## Lint

- 两文件无 linter 错误

## Commit

```
feat(frontend): show internal course reference price in sidebar and list (#75)
```

## 手测清单（75，待人工）

- [ ] 待定课：Hero 无「免费」标，侧栏/列表为「待定」
- [ ] 免费课：Hero 有免费标 + 侧栏/列表「免费」
- [ ] 有金额：¥ 样式正常，原价划线（若有）
- [ ] 公开课价逻辑不变
