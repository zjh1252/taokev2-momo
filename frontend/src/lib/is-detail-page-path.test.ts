import { describe, expect, it } from 'vitest';
import { isDetailPagePath } from './is-detail-page-path';

describe('isDetailPagePath', () => {
  it('matches entity detail pages', () => {
    expect(isDetailPagePath('/trainer/1001')).toBe(true);
    expect(isDetailPagePath('/trainer/1001.htm')).toBe(true);
    expect(isDetailPagePath('/opencourse/12345')).toBe(true);
    expect(isDetailPagePath('/opencourse/12345.htm')).toBe(true);
    expect(isDetailPagePath('/opencourse/TK-000015-1')).toBe(true);
    expect(isDetailPagePath('/inhousecourse/99')).toBe(true);
    expect(isDetailPagePath('/inhousecourse/99.htm')).toBe(true);
    expect(isDetailPagePath('/innercourses/99')).toBe(true);
    expect(isDetailPagePath('/innercourses/99.htm')).toBe(true);
    expect(isDetailPagePath('/company/88')).toBe(true);
    expect(isDetailPagePath('/association/5')).toBe(true);
    expect(isDetailPagePath('/video/200')).toBe(true);
    expect(isDetailPagePath('/video/200/play')).toBe(true);
    expect(isDetailPagePath('/vedio/200')).toBe(true);
    expect(isDetailPagePath('/vedio/200.htm')).toBe(true);
    expect(isDetailPagePath('/videos/200')).toBe(true);
    expect(isDetailPagePath('/case/42')).toBe(true);
  });

  it('matches trainer sub-pages', () => {
    expect(isDetailPagePath('/trainer/1001/courses')).toBe(true);
    expect(isDetailPagePath('/trainer/1001/cases')).toBe(true);
    expect(isDetailPagePath('/trainer/1001/cases/9')).toBe(true);
    expect(isDetailPagePath('/trainer/1001/video')).toBe(true);
    expect(isDetailPagePath('/trainer/1001/comment')).toBe(true);
    expect(isDetailPagePath('/trainer/1001/book')).toBe(true);
  });

  it('excludes list and utility pages', () => {
    expect(isDetailPagePath('/')).toBe(false);
    expect(isDetailPagePath('/trainer')).toBe(false);
    expect(isDetailPagePath('/opencourse')).toBe(false);
    expect(isDetailPagePath('/inhousecourse')).toBe(false);
    expect(isDetailPagePath('/company')).toBe(false);
    expect(isDetailPagePath('/association')).toBe(false);
    expect(isDetailPagePath('/video')).toBe(false);
    expect(isDetailPagePath('/case')).toBe(false);
    expect(isDetailPagePath('/search')).toBe(false);
    expect(isDetailPagePath('/cart')).toBe(false);
    expect(isDetailPagePath('/checkout')).toBe(false);
    expect(isDetailPagePath('/city/shanghai')).toBe(false);
    expect(isDetailPagePath('/login')).toBe(false);
    expect(isDetailPagePath('/dashboard')).toBe(false);
    expect(isDetailPagePath('/dashboard/orders')).toBe(false);
  });
});
