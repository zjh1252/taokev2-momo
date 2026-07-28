# Task 7 Report: 播放页 150% 缩放左右留白（#13）

## 状态

✅ 完成

## Commit

```
fix(frontend): 视频播放页高缩放布局左右留白均衡
```

变更文件：
- `frontend/src/features/video/components/play/VideoPlayPageContent.tsx`
- `frontend/src/app/[locale]/(public)/videos/[id]/play/page.tsx`

## 实现摘要

- 播放区网格：`xl:grid-cols-[1fr_300px]` → `lg:grid-cols-[minmax(0,1fr)_minmax(240px,280px)]`，并加 `max-w-6xl mx-auto w-full`
- 侧栏/移动端评价卡断点：`xl` → `lg`，与网格列布局一致
- 播放页外层容器：`max-w-[1280px]` → `max-w-6xl`，高缩放下整体居中、两侧留白更对称

## 验证

| 项 | 结果 |
|---|---|
| `pnpm exec tsc --noEmit` | ✅ 通过 |
| ESLint（改动文件） | ✅ 无新增问题 |
| Chrome 150% 手工验收 | ⏳ 需本地打开 `/videos/{id}/play` 确认左右留白与评价卡可见性 |

## 备注

侧栏宽度上限由 300px 收紧为 240–280px，避免高 DPI/高缩放下主栏被挤压；若 100% 缩放下侧栏偏窄可再微调 `minmax` 上限。
