### Task 1: 专家筛选点选关浮层 + 常驻城市文案（#3、#6）

**Files:**
- Modify: `frontend/src/features/trainer/components/list/TrainerFilters.tsx`
- Modify: `frontend/src/messages/zh-CN/trainer.json`

**Interfaces:**
- Consumes: 现有 `onChange` / `TrainerFilterValue`
- Produces: 点选后浮层关闭；label 文案「常驻城市」

- [ ] **Step 1: 改 i18n 文案**

将 `frontend/src/messages/zh-CN/trainer.json` 中：

```json
"city": "常驻省市"
```

改为：

```json
"city": "常驻城市"
```

- [ ] **Step 2: TrainerFilters 标签与关浮层**

1. `FILTER_ITEMS` 中 province 的 `label: '长驻省市'` 改为 `label: '常驻城市'`。
2. 注释/JSDoc 中「长驻省市」同步改为「常驻城市」（参数名不动）。
3. 在三个 handler 末尾关闭浮层：

```tsx
const closeFlyout = () => setActiveFilter(null);

const handleExpertisePick = (parentName?: string, childName?: string, categoryId?: number) => {
  onChange({
    ...value,
    fieldParentName: parentName,
    fieldChildName: childName,
    expertiseCategoryId: categoryId,
  });
  closeFlyout();
};

const handleIndustryPick = (name?: string, categoryId?: number) => {
  onChange({ ...value, industryName: name, industryCategoryId: categoryId });
  closeFlyout();
};

const handleProvincePick = (item?: RegionItem) => {
  onChange({ ...value, regionName: item?.name, provinceId: item?.id });
  closeFlyout();
};
```

- [ ] **Step 3: 手工验收**

Run: `cd frontend && pnpm lint`  
Expected: 无新增 error  

浏览器：打开专家列表 → hover 擅长领域 → 点任意选项 → 列表更新且浮层立即消失；侧栏文案为「常驻城市」。

- [ ] **Step 4: Commit（仅当用户授权）**

```bash
git add frontend/src/features/trainer/components/list/TrainerFilters.tsx frontend/src/messages/zh-CN/trainer.json
git commit -m "$(cat <<'EOF'
fix(frontend): 专家筛选点选关浮层并统一常驻城市文案

EOF
)"
```

---

