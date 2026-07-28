### Task 2: 首页专家大卡简介铺满（#5）

**Files:**
- Modify: `frontend/src/features/home/components/ExpertsSection.tsx`（`MainExpertCard`）

**Interfaces:**
- Consumes: `getExpertCardCopy(expert)`
- Produces: bio 在标签上方占满可用垂直空间

- [ ] **Step 1: 调整 MainExpertCard 文本区布局**

将右侧文案区中 bio 与底部操作区改为：

```tsx
<div className="md:w-[55%] p-6 lg:p-8 flex flex-col flex-1 relative z-20 min-h-0">
  <h3 className="text-3xl font-black mb-2 text-slate-800 truncate">
    {expert.name}
    {copy.title ? (
      <span className="text-lg font-normal text-slate-500 ml-2">{copy.title}</span>
    ) : null}
  </h3>
  {copy.subtitle ? (
    <p className="text-primary text-sm font-bold mb-3 line-clamp-2">{copy.subtitle}</p>
  ) : null}
  {copy.bio ? (
    <p className="text-slate-500 text-sm mb-4 leading-relaxed flex-1 min-h-0 overflow-hidden">
      {copy.bio}
    </p>
  ) : null}
  <div className="mt-auto flex flex-col gap-4 pt-2 shrink-0">
    <ExpertTagList
      tags={expert.tags}
      limit={4}
      tagClassName="bg-slate-100 text-slate-600 px-3 py-1 rounded text-xs font-medium"
    />
    <span className="bg-primary text-white px-6 py-3 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 w-full shadow-sm">
      查看专家详情
    </span>
  </div>
</div>
```

要点：去掉 bio 的 `line-clamp-6`；bio 加 `flex-1`；标签区 `shrink-0` + `mt-auto`。模块外层 `md:h-[500px]` **不要改**。

- [ ] **Step 2: 手工验收**

浏览器首页推荐专家：大卡简介铺满姓名/副标题与标签之间的空白；中卡/小卡不动。

- [ ] **Step 3: Commit（仅当用户授权）**

```bash
git add frontend/src/features/home/components/ExpertsSection.tsx
git commit -m "$(cat <<'EOF'
fix(frontend): 首页推荐专家大卡简介铺满可用高度

EOF
)"
```

---

