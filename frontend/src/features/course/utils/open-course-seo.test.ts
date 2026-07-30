import { describe, expect, it } from 'vitest';
import {
  formatOpenCourseNo,
  getOpenCoursePlanSeoPath,
  getPlanDisplayNo,
  resolveOpenCourseDisplayNo,
  resolveOpenCourseSeoPathId,
} from './open-course-seo';

describe('open-course-seo', () => {
  it('uses seoPathId when present', () => {
    expect(resolveOpenCourseSeoPathId({ id: 276819, seoPathId: 438103 })).toBe(438103);
  });

  it('falls back to course id', () => {
    expect(resolveOpenCourseSeoPathId({ id: 276819 })).toBe(276819);
  });

  it('formats plain digits', () => {
    expect(formatOpenCourseNo(438103)).toBe('438103');
  });

  it('plan display prefers sortOrder', () => {
    expect(getPlanDisplayNo({ sortOrder: 438103 }, 276819, 1)).toBe('438103');
  });

  it('plan path uses sortOrder', () => {
    expect(getOpenCoursePlanSeoPath({ sortOrder: 438103 }, 276819, 1)).toBe(
      '/opencourse/438103.htm',
    );
  });

  it('display prefers pathId when it matches a plan sortOrder', () => {
    expect(
      resolveOpenCourseDisplayNo(
        {
          id: 276819,
          displayCourseNo: 999,
          plans: [{ sortOrder: 438103, startTime: '2026-08-03T00:00:00' }],
        },
        438103,
      ),
    ).toBe(438103);
  });
});
