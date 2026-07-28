### Task 5: 视频分类只保留一级 + 单测（#14）

**Files:**
- Create: `frontend/src/features/video/utils/category-tags.ts`
- Create: `frontend/src/features/video/utils/category-tags.test.ts`
- Modify: `frontend/src/features/video/components/play/VideoPlayPageContent.tsx`

**Interfaces:**
- Produces: `buildVideoCategoryTags(video): { label: string; href?: string }[]` — 最多 1 项

- [ ] **Step 1: 写失败单测**

```ts
// frontend/src/features/video/utils/category-tags.test.ts
import { describe, expect, it } from 'vitest';
import { buildVideoCategoryTags } from './category-tags';

describe('buildVideoCategoryTags', () => {
  it('returns only the first category when sub and keywords exist', () => {
    const tags = buildVideoCategoryTags({
      categoryId: 1,
      categoryName: '领导力',
      subCategoryId: 2,
      subCategoryName: '中层管理',
      keywords: '沟通,演讲',
    });
    expect(tags).toEqual([
      { label: '领导力', href: expect.stringContaining('categoryId=1') },
    ]);
    expect(tags).toHaveLength(1);
  });

  it('returns empty when no categoryName', () => {
    expect(
      buildVideoCategoryTags({
        categoryId: null,
        categoryName: null,
        subCategoryId: 2,
        subCategoryName: '中层管理',
        keywords: '沟通',
      }),
    ).toEqual([]);
  });
});
```

（若 `VideoDetail` 字段类型不允许 null，按实际类型改测试入参。）

- [ ] **Step 2: 跑测确认失败**

Run: `cd frontend && pnpm exec vitest run src/features/video/utils/category-tags.test.ts`  
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现纯函数**

```ts
// frontend/src/features/video/utils/category-tags.ts
import { ROUTES } from '@/config/routes';

type CategoryTagSource = {
  categoryId?: number | null;
  categoryName?: string | null;
  subCategoryId?: number | null;
  subCategoryName?: string | null;
  keywords?: string | null;
};

export function buildVideoCategoryTags(
  video: CategoryTagSource,
): { label: string; href?: string }[] {
  const name = video.categoryName?.trim();
  if (!name) return [];
  const href =
    video.categoryId != null
      ? `${ROUTES.ONLINE_COURSES}?categoryId=${video.categoryId}`
      : undefined;
  return [{ label: name, href }];
}
```

- [ ] **Step 4: 跑测确认通过**

Run: `cd frontend && pnpm exec vitest run src/features/video/utils/category-tags.test.ts`  
Expected: PASS

- [ ] **Step 5: 替换 VideoPlayPageContent 内联逻辑**

```tsx
import { buildVideoCategoryTags } from '../../utils/category-tags';

const categoryTags = useMemo(() => buildVideoCategoryTags(video), [video]);
```

删除原 `categoryTags` 中拼接二级与 keywords 的逻辑。

- [ ] **Step 6: Commit（仅当用户授权）**

```bash
git add frontend/src/features/video/utils/category-tags.ts frontend/src/features/video/utils/category-tags.test.ts frontend/src/features/video/components/play/VideoPlayPageContent.tsx
git commit -m "$(cat <<'EOF'
fix(frontend): 视频播放页分类标签仅保留一级

EOF
)"
```

---

