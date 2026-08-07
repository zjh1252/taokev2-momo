import { describe, expect, it } from 'vitest';
import { isPlanEnrolling } from './display';

describe('isPlanEnrolling', () => {
  const now = Date.parse('2026-08-06T12:00:00+08:00');

  it('uses endTime: long-running plan still enrolling (bug #69)', () => {
    expect(
      isPlanEnrolling(
        { startTime: '2009-08-01T00:00:00', endTime: '2031-07-01T00:00:00' },
        now,
      ),
    ).toBe(true);
  });

  it('future start and end → enrolling', () => {
    expect(
      isPlanEnrolling(
        { startTime: '2026-12-19T00:00:00', endTime: '2026-12-21T00:00:00' },
        now,
      ),
    ).toBe(true);
  });

  it('already started but not ended → enrolling', () => {
    expect(
      isPlanEnrolling(
        { startTime: '2026-01-01T00:00:00', endTime: '2026-12-31T00:00:00' },
        now,
      ),
    ).toBe(true);
  });

  it('ended before now → not enrolling', () => {
    expect(
      isPlanEnrolling(
        { startTime: '2020-01-01T00:00:00', endTime: '2020-01-03T00:00:00' },
        now,
      ),
    ).toBe(false);
  });

  it('start after end → not enrolling (dirty data)', () => {
    expect(
      isPlanEnrolling(
        { startTime: '2030-01-02T00:00:00', endTime: '2030-01-01T00:00:00' },
        now,
      ),
    ).toBe(false);
  });

  it('missing endTime → not enrolling', () => {
    expect(isPlanEnrolling({ startTime: '2030-01-01T00:00:00' }, now)).toBe(false);
  });
});
