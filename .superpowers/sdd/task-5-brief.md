### Task 5: D8 — C 端去掉 min-w-1400 + Admin 分类适配

**Files:**
- Modify: `frontend/src/app/[locale]/(public)/layout.tsx`
- Modify: `admin-frontend/src/features/categories/components/category-tree-table.tsx`
- Modify: `admin-frontend/src/features/categories/components/category-form-dialog.tsx`

- [ ] **Step 1: public layout**

```tsx
return (
  <div className="w-full overflow-x-auto">
    <div className="min-w-0">
      <PublicHeader />
      <main className="flex-1 bg-[var(--page-bg)]">{children}</main>
      <AppFooter />
    </div>
    <FloatingActions />
  </div>
);
```

- [ ] **Step 2: 分类树**

表格外包：

```tsx
<div className="w-full overflow-x-auto">
  <Table className="min-w-[720px]">
    ...
  </Table>
</div>
```

- [ ] **Step 3: 分类弹窗**

```tsx
<DialogContent className="max-w-[min(420px,calc(100vw-2rem))] sm:max-w-[min(420px,calc(100vw-2rem))]">
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/[locale]/(public)/layout.tsx \
        admin-frontend/src/features/categories/components/category-tree-table.tsx \
        admin-frontend/src/features/categories/components/category-form-dialog.tsx
git commit -m "$(cat <<'EOF'
fix(ui): Win11 缩放下取消强制 1400 宽并适配分类树

去掉 C 端 public layout 的 min-w-1400；Admin 分类表可横滚、弹窗限视口宽。
EOF
)"
```

---

## Spec coverage check

| Spec | Task |
|------|------|
| D1 单城缓存 + size10 + ENROLLING + key 维 | Task 1 |
| D1 不改 Upcoming 查询 / TTL 失效 | Task 1（evict 不扫城） |
| D2 案例 FE | Task 3 |
| D2 highlight/book/logo BE | Task 2 |
| D2 C 表单 | Task 3 |
| D2 Admin 表单 | Task 4 |
| D8 layout / 分类树 / 弹窗 | Task 5 |

## Placeholder scan

无 TBD；`InstitutionRequest` 半更新冲突处理已写明排查路径。
