### Task 3: D2 C 端 — 案例 / 精彩瞬间 / 机构 / 入驻著作

**Files:**
- Modify: `frontend/src/features/trainer-case/lib/case-form-rules.ts`
- Modify: `frontend/src/app/[locale]/(usercenter)/dashboard/cases/create/page.tsx`（封面 FormField `required`）
- Modify: `frontend/src/app/[locale]/(usercenter)/dashboard/cases/[id]/edit/page.tsx`
- Modify: `frontend/src/app/[locale]/(usercenter)/dashboard/highlights/create/page.tsx`
- Modify: `frontend/src/app/[locale]/(usercenter)/dashboard/highlights/[id]/edit/page.tsx`
- Modify: `frontend/src/features/role-apply/components/role-forms/InstitutionApplyForm.tsx`
- Modify: `frontend/src/features/role-apply/components/TrainerBooksEditor.tsx`

- [ ] **Step 1: 案例规则**

`CASE_RULES` 增加：

```ts
coverImage: { required: true, requiredMessage: '请上传封面图' },
description: { required: true, requiredMessage: '请填写案例描述' }, // 若 BE 已要求且 FE 缺则补；已有则跳过
```

create/edit 页封面 `FormField` 加 `required`。

- [ ] **Step 2: 精彩瞬间 create/edit**

提交前：

```ts
if (!form.coverImage?.trim()) {
  toast.error('请上传封面图');
  return;
}
```

封面 `FormField label="封面图" required`。

- [ ] **Step 3: 机构入驻**

`InstitutionApplyForm`：

```tsx
<FormField label="公司 Logo" required>
```

规则对象加：

```ts
logoUrl: { required: true, requiredMessage: '请上传机构 Logo' },
```

- [ ] **Step 4: 入驻著作编辑器**

`TrainerBooksEditor`：保存单条时若缺 `coverUrl` toast「请上传封面图」并 return；Label 改为必填样式。

- [ ] **Step 5: 手测 / lint（有测则跑相关）**

```bash
cd frontend
pnpm lint
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/trainer-case/lib/case-form-rules.ts \
        frontend/src/app/[locale]/(usercenter)/dashboard/cases \
        frontend/src/app/[locale]/(usercenter)/dashboard/highlights \
        frontend/src/features/role-apply/components/role-forms/InstitutionApplyForm.tsx \
        frontend/src/features/role-apply/components/TrainerBooksEditor.tsx
git commit -m "$(cat <<'EOF'
fix(frontend): 案例/精彩瞬间/机构Logo/著作封面必填

对齐 Batch D 图片必填尖刀，C 端提交前拦截空图。
EOF
)"
```

---

