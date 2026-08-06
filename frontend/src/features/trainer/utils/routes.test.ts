import { describe, expect, it } from 'vitest';
import { getTrainerDetailTabHref } from './routes';

describe('getTrainerDetailTabHref', () => {
  it('returns home SEO path by default', () => {
    expect(getTrainerDetailTabHref(1001)).toBe('/trainer/1001.htm');
  });

  it('returns comments tab path for 评价入口', () => {
    expect(getTrainerDetailTabHref(1001, 'comments')).toBe('/trainer/1001/comment.htm');
  });

  it('preserves trainer list return path on detail tab links', () => {
    expect(
      getTrainerDetailTabHref(1001, 'comments', '/trainer/field=customer-service&page=2.htm'),
    ).toBe(
      '/trainer/1001/comment.htm?from=%2Ftrainer%2Ffield%3Dcustomer-service%26page%3D2.htm',
    );
  });

  it('drops unsafe trainer list return path on detail tab links', () => {
    expect(getTrainerDetailTabHref(1001, 'comments', '/trainer/1002.htm')).toBe(
      '/trainer/1001/comment.htm',
    );
  });
});
