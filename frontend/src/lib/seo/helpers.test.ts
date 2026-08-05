import { describe, expect, it } from 'vitest';
import { preferSeoDescription, truncateDescription } from './helpers';

describe('seo helpers', () => {
  it('prefers custom seo description when provided', () => {
    expect(preferSeoDescription('  自定义SEO描述  ')).toBe('自定义SEO描述');
  });

  it('falls back to template and truncates to seo length budget', () => {
    const longText =
      '淘课网提供企业培训课程、讲师和机构信息，帮助企业快速筛选适合的培训资源，并且为不同类型的详情页提供更完整的描述文案。';

    expect(preferSeoDescription(undefined, longText).length).toBeLessThanOrEqual(85);
    expect(truncateDescription(longText, 85).length).toBeLessThanOrEqual(85);
  });
});
