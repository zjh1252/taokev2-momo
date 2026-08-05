### Task 4: D2 Admin — 案例 / 精彩瞬间 / 著作创建表单

**Files:**
- Modify: `admin-frontend/src/features/trainer-cases/components/case-create-form.tsx`
- Modify: `admin-frontend/src/features/trainer-highlights/components/highlight-create-form.tsx`
- Modify: `admin-frontend/src/features/books/components/book-create-form.tsx`

- [ ] **Step 1: 案例**

提交前：

```ts
if (!coverUrl.trim()) {
  toast.error('请上传封面图');
  return;
}
```

Label 标必填；`coverImage: coverUrl`（勿再 `|| undefined`）。

- [ ] **Step 2: 精彩瞬间 / 著作**

同样：空封面 toast + 必填 Label；payload 传非空 URL。

- [ ] **Step 3: lint**

```bash
cd admin-frontend
bun lint
```

- [ ] **Step 4: Commit**

```bash
git add admin-frontend/src/features/trainer-cases/components/case-create-form.tsx \
        admin-frontend/src/features/trainer-highlights/components/highlight-create-form.tsx \
        admin-frontend/src/features/books/components/book-create-form.tsx
git commit -m "$(cat <<'EOF'
fix(admin): 案例/精彩瞬间/著作创建封面必填

管理端创建表单与后端 NotBlank 对齐，禁止空封面提交。
EOF
)"
```

---

