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
