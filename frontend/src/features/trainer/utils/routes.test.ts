import { describe, expect, it } from 'vitest';
import { getTrainerDetailTabHref } from './routes';

describe('getTrainerDetailTabHref', () => {
  it('returns home SEO path by default', () => {
    expect(getTrainerDetailTabHref(1001)).toBe('/trainer/1001.htm');
  });

  it('returns comments tab path for 评价入口', () => {
    expect(getTrainerDetailTabHref(1001, 'comments')).toBe('/trainer/1001/comment.htm');
  });
});
