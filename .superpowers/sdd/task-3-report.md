# Task 3 Report: D2 C 端 — 案例 / 精彩瞬间 / 机构 / 入驻著作

**日期**: 2026-07-29  
**状态**: ✅ 完成

## 改动摘要

| 区域 | 文件 | 改动 |
|------|------|------|
| 案例规则 | `frontend/src/features/trainer-case/lib/case-form-rules.ts` | `CASE_RULES` 新增 `coverImage`、`description` 必填 |
| 案例 create/edit | `dashboard/cases/create/page.tsx`, `[id]/edit/page.tsx` | 封面 `FormField` 加 `required`；提交走既有 `validateForm` |
| 精彩瞬间 create/edit | `dashboard/highlights/create/page.tsx`, `[id]/edit/page.tsx` | 提交前 `coverImage` 校验 + toast；封面 `FormField required` |
| 机构入驻 | `InstitutionApplyForm.tsx` | Logo `FormField required`；`INSTITUTION_RULES.logoUrl` 必填 |
| 入驻著作 | `TrainerBooksEditor.tsx` | 保存单条缺 `coverUrl` 时 toast 拦截；Label `封面图 *` |

## 校验文案

- 封面：`请上传封面图`
- 机构 Logo：`请上传机构 Logo`
- 案例描述：`请填写案例描述`（对齐 BE `@NotBlank`）

## 刻意未改

- **admin-frontend**（Task 4 范围）
- **backend**（Task 2 已完成）
- 精彩瞬间「保存草稿」：BE draft 接口无 `@Valid`，允许不完整字段
- 案例「描述」FormField 未标 `required`（brief 仅要求规则层补齐）

## Lint

```bash
cd frontend && pnpm lint
```

- **退出码**: 1（仓库既有问题，非本任务引入）
- **本任务相关文件**: 无新增 error；`highlights/create/page.tsx` 有既有 `_file` unused warning

## Commit

```
fix(frontend): 案例/精彩瞬间/机构Logo/著作封面必填

对齐 Batch D 图片必填尖刀，C 端提交前拦截空图。
```

## 手测建议

1. 案例 create/edit：不上传封面 / 不填描述 → toast 拦截
2. 精彩瞬间 create/edit：不上传封面 → toast「请上传封面图」
3. 机构入驻：不上传 Logo → 提交 toast「请上传机构 Logo」
4. 专家入驻著作：弹窗保存无封面 → toast「请上传封面图」
