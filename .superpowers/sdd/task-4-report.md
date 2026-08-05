# Task 4 Report: D2 Admin — 案例 / 精彩瞬间 / 著作创建表单

**日期**: 2026-07-29  
**状态**: ✅ 完成

## 改动摘要

| 文件 | 改动 |
|------|------|
| `trainer-cases/components/case-create-form.tsx` | 提交前 `coverUrl.trim()` 校验 + toast；Label `封面 *`；payload `coverImage: coverUrl` |
| `trainer-highlights/components/highlight-create-form.tsx` | 同上 |
| `books/components/book-create-form.tsx` | 同上；payload `coverUrl: coverUrl` |

## 校验文案

- 空封面：`请上传封面图`

## Lint

```bash
cd admin-frontend && bun lint
```

- **退出码**: 1（仓库既有 20 warnings + 1 error，非本任务文件）
- **本任务相关文件**: 无新增 lint 问题

## Commit

```
fix(admin): 案例/精彩瞬间/著作创建封面必填

管理端创建表单与后端 NotBlank 对齐，禁止空封面提交。
```

## 手测建议

1. 案例 / 精彩瞬间 / 著作创建页：不上传封面直接提交 → toast「请上传封面图」，不发起请求
2. 上传或粘贴封面 URL 后提交 → 正常创建
