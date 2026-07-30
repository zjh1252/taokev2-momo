# Task 5 Report: D8 — C 端去掉 min-w-1400 + Admin 分类适配

**日期**: 2026-07-29  
**状态**: ✅ 完成

## 改动摘要

| 文件 | 改动 |
|------|------|
| `frontend/src/app/[locale]/(public)/layout.tsx` | `min-w-[1400px]` → `min-w-0`，保留外层 `overflow-x-auto` |
| `admin-frontend/.../category-tree-table.tsx` | 表格外包 `w-full overflow-x-auto`，`Table` 加 `min-w-[720px]` |
| `admin-frontend/.../category-form-dialog.tsx` | `DialogContent` 限宽 `min(420px, calc(100vw-2rem))` |

## Lint

- 本任务相关文件：无新增 lint 问题

## Commit

```
fix(ui): Win11 缩放下取消强制 1400 宽并适配分类树

去掉 C 端 public layout 的 min-w-1400；Admin 分类表可横滚、弹窗限视口宽。
```

**Hash**: `af40dac6`

## 手测建议

1. C 端任意 public 页：Win11 125%/150% 下无强制 1400px 横向溢出
2. Admin 分类管理：窄视口下表格可横滚
3. Admin 分类新增/编辑弹窗：窄视口下不超出视口宽度
