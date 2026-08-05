### Task 8: 总验收

- [ ] **Step 1: lint + 相关单测**

```bash
cd frontend
pnpm lint
pnpm exec vitest run src/features/video/utils/category-tags.test.ts src/features/trainer/utils/routes.test.ts
```

Expected: lint 无新增 error；测试 PASS

- [ ] **Step 2: 对照 spec §5 清单手测**

按 `docs/superpowers/specs/2026-07-28-frontend-opt-batch-a-design.md` §5 逐条勾选 3/5/6/9/10/11/12/13/14。

---

## Spec Coverage Checklist

| Spec 条目 | Task |
|-----------|------|
| #3 筛选关浮层 | Task 1 |
| #5 大卡铺满 | Task 2 |
| #6 常驻城市 | Task 1 |
| #9 顶栏外链 | Task 3 |
| #10 评价居中 | Task 4 |
| #11 Tab 滚动避让 | Task 4 |
| #12 播放器中文 | Task 6 |
| #13 150% 留白 | Task 7 |
| #14 分类只留一级 | Task 5 |
| 总验收 | Task 8 |
