import { describe, expect, it } from 'vitest';
import { mergeListUrlParams } from './sync-list-filter-url';

describe('mergeListUrlParams', () => {
  it('keeps existing filter params when normalizing page back to first page', () => {
    const params = mergeListUrlParams('keyword=管理&categoryId=12&page=3', {}, 1);

    expect(params.toString()).toBe('keyword=%E7%AE%A1%E7%90%86&categoryId=12');
  });

  it('applies a new keyword without dropping an existing category filter', () => {
    const params = mergeListUrlParams('categoryId=8&page=2', { keyword: ' 行政 ' }, 1);

    expect(params.toString()).toBe('categoryId=8&keyword=%E8%A1%8C%E6%94%BF');
  });
});
