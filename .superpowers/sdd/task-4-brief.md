### Task 4: 专家详情 Tab / 评价滚动（#10、#11）

**Files:**
- Modify: `frontend/src/features/trainer/components/detail/TrainerDetailContent.tsx`
- Modify: `frontend/src/features/trainer/components/detail/TrainerDetailPageView.tsx`（若内容滚动锚点更适合挂在外层）

**Interfaces:**
- Consumes: `activeTab: TrainerTabId`、现有 `getTrainerDetailTabHref`
- Produces: 内容区 `scroll-margin-top`；评价 Tab 将「我要评价」滚到视口中线附近

- [ ] **Step 1: 内容区增加滚动锚点**

在 `TrainerDetailContent` 根内容容器（`min-h-[800px]` 那层）加：

```tsx
id="trainer-detail-tab-panel"
className="min-h-[800px] scroll-mt-[120px]"
```

`120px` 需覆盖 sticky 顶栏 + Tab 条高度；若实测遮挡，可调到 `140`/`160`。

- [ ] **Step 2: Tab 切换后滚到内容区顶部**

在 `TrainerDetailContent`（`'use client'`）内：

```tsx
useEffect(() => {
  const el = document.getElementById('trainer-detail-tab-panel');
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}, [activeTab]);
```

保留现有 `Link` + SEO URL + 下划线选中，**不要**改成单页堆模块。

- [ ] **Step 3: 评价 Tab 将「我要评价」滚到视口中线**

1. 给「我要评价」按钮加 `ref` 或 `id="trainer-review-cta"`。
2. 在 `ReviewsView` 挂载且 `activeTab === 'comments'` 对应视图已渲染时：

```tsx
useEffect(() => {
  const el = document.getElementById('trainer-review-cta');
  if (!el) return;
  const headerOffset = 120; // sticky 顶栏+Tab 约估，可按实测微调
  const rect = el.getBoundingClientRect();
  const absoluteTop = window.scrollY + rect.top;
  const target =
    absoluteTop - window.innerHeight / 2 + rect.height / 2;
  // 避免滚到顶栏下方过少：至少留 headerOffset
  const y = Math.max(target, absoluteTop - headerOffset);
  window.scrollTo({ top: y, behavior: 'smooth' });
}, [/* ReviewsView mount: trainerUserId */ trainerUserId]);
```

注意：Step 2 的 panel scroll 与 Step 3 可能冲突——**评价 Tab 以 CTA 居中为准**，可在 `activeTab === 'comments'` 时跳过 panel 的 `scrollIntoView`，只执行 CTA 居中。

- [ ] **Step 4: 手工验收**

- 打开 `/trainer/{id}.htm`，点击各 Tab：内容顶部不被顶栏挡住；URL 与下划线正确。
- 打开 `/trainer/{id}/comment.htm`：「我要评价」约在视口垂直中线。
- 连续快速点 Tab：滚动可被后续点击打断（浏览器 smooth scroll 默认行为即可）。

- [ ] **Step 5: Commit（仅当用户授权）**

```bash
git add frontend/src/features/trainer/components/detail/TrainerDetailContent.tsx
git commit -m "$(cat <<'EOF'
fix(frontend): 专家详情 Tab 滚动避让顶栏并居中评价按钮

EOF
)"
```

---

