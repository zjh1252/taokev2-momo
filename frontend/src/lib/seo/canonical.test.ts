import { describe, expect, it } from 'vitest';
import { buildCanonicalUrl, pickCanonicalSearchParams } from './canonical';

describe('buildCanonicalUrl', () => {
  it('uses the configured v2 host and normalizes paths', () => {
    expect(buildCanonicalUrl('/trainer')).toBe('https://v2.taoke.com/trainer');
    expect(buildCanonicalUrl('https://example.com/video/12.htm?utm_source=x')).toBe(
      'https://v2.taoke.com/video/12.htm',
    );
  });

  it('keeps only allowed canonical query parameters', () => {
    const params = new URLSearchParams({
      page: '2',
      categoryName: '人力资源',
      utm_source: 'ad',
      share: '1',
    });

    expect(buildCanonicalUrl('/opencourse', params, ['page', 'categoryName'])).toBe(
      'https://v2.taoke.com/opencourse?categoryName=%E4%BA%BA%E5%8A%9B%E8%B5%84%E6%BA%90&page=2',
    );
  });

  it('drops default page one from canonical urls', () => {
    expect(buildCanonicalUrl('/video', new URLSearchParams({ page: '1' }), ['page'])).toBe(
      'https://v2.taoke.com/video',
    );
  });

  it('picks canonical params from Next searchParams objects', () => {
    const params = pickCanonicalSearchParams(
      {
        page: '3',
        categoryName: ['领导力', '营销'],
        utm_campaign: 'x',
      },
      ['categoryName', 'page'],
    );

    expect(Array.from(params.entries())).toEqual([
      ['categoryName', '领导力'],
      ['categoryName', '营销'],
      ['page', '3'],
    ]);
  });
});
