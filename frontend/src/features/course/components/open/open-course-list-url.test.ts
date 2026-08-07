import { describe, expect, it } from 'vitest';
import {
  hasOpenCourseBrowserFilter,
  openCourseBrowserDiffersFromSsr,
  parseOpenCourseFiltersFromSearch,
} from './open-course-list-url';

describe('open-course-list-url', () => {
  it('parses categoryIds + categoryName from query (bug #68 URL shape)', () => {
    const state = parseOpenCourseFiltersFromSearch(
      'categoryIds=184&categoryName=%E4%BA%BA%E5%8A%9B%E8%B5%84%E6%BA%90',
    );
    expect(state.filters.categoryIds).toEqual([184]);
    expect(state.filters.categoryNames).toEqual(['人力资源']);
    expect(hasOpenCourseBrowserFilter(state)).toBe(true);
  });

  it('detects browser filter when SSR is empty (detail back remount)', () => {
    const browser = parseOpenCourseFiltersFromSearch(
      'categoryIds=184&categoryName=人力资源',
    );
    expect(
      openCourseBrowserDiffersFromSsr(browser, {
        categoryIds: undefined,
        provinceIds: undefined,
        institutionId: undefined,
        cityIds: undefined,
        page: 1,
      }),
    ).toBe(true);
  });

  it('does not differ when SSR already matches browser', () => {
    const browser = parseOpenCourseFiltersFromSearch(
      'categoryIds=184&categoryName=人力资源',
    );
    expect(
      openCourseBrowserDiffersFromSsr(browser, {
        categoryIds: [184],
        page: 1,
      }),
    ).toBe(false);
  });
});
