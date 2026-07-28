### Task 3: 顶栏产品矩阵外链（#9）

**Files:**
- Modify: `frontend/src/components/layout/top-nav-bar.tsx`

**Interfaces:**
- Produces: `GROUP_LINKS` 六项外链，无「淘课网」

- [ ] **Step 1: 更新 GROUP_LINKS 与锚点属性**

替换为：

```tsx
const GROUP_LINKS = [
  { label: '淘课集团', href: 'https://www.taoke.com.cn/' },
  { label: '培训宝', href: 'https://www.91pxb.com/' },
  { label: '目标通', href: 'https://www.91mbt.com/' },
  { label: 'AI 导师', href: 'https://a23880.91pxb.com/pc_elearning/#/ai/mentor/604996/list' },
  { label: '智能创导', href: 'https://a23880.91pxb.com/pc_elearning/#/ai/extraction/604996' },
  { label: 'AI 陪练', href: 'https://a23880.91pxb.com/pc_elearning/#/ai/training_partner/604996/list' },
] as const;
```

`<a>` 增加：

```tsx
<a
  href={link.href}
  target="_blank"
  rel="noopener noreferrer"
  className="hover:text-primary transition-colors"
>
  {link.label}
</a>
```

确认已删除「淘课网」项。

- [ ] **Step 2: 手工验收**

顶栏六项均可新标签打开；无「淘课网」。

- [ ] **Step 3: Commit（仅当用户授权）**

```bash
git add frontend/src/components/layout/top-nav-bar.tsx
git commit -m "$(cat <<'EOF'
fix(frontend): 配置顶栏集团产品外链并移除淘课网入口

EOF
)"
```

---

