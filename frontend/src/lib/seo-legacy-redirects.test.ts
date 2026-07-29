import { describe, expect, it } from 'vitest';
import {
  isLegacyNumericTrainerFilterPath,
  legacyVideoChannelRedirectTarget,
  legacyVedioDetailRedirectTarget,
} from './seo-legacy-redirects';

describe('isLegacyNumericTrainerFilterPath', () => {
  it('matches multi-segment numeric filter', () => {
    expect(
      isLegacyNumericTrainerFilterPath(
        '/trainer/501/0/0/0/0/0/0/0/0/0/def/0/0/0/0/0/0/0/1.htm',
      ),
    ).toBe(true);
    expect(isLegacyNumericTrainerFilterPath('/trainer/501/0/0/1.htm')).toBe(true);
  });

  it('rejects trainer detail and section and field slug', () => {
    expect(isLegacyNumericTrainerFilterPath('/trainer/123.htm')).toBe(false);
    expect(isLegacyNumericTrainerFilterPath('/trainer/123/courses.htm')).toBe(false);
    expect(isLegacyNumericTrainerFilterPath('/trainer/field=%E7%BB%8F%E8%90%A5.htm')).toBe(
      false,
    );
    expect(isLegacyNumericTrainerFilterPath('/trainer')).toBe(false);
  });
});

describe('legacyVideoChannelRedirectTarget', () => {
  it('maps /videos and /vedio to /video keeping query', () => {
    expect(legacyVideoChannelRedirectTarget('/videos', '?q=1')).toBe('/video?q=1');
    expect(legacyVideoChannelRedirectTarget('/vedio', '')).toBe('/video');
  });

  it('ignores /video and nested paths', () => {
    expect(legacyVideoChannelRedirectTarget('/video', '')).toBeNull();
    expect(legacyVideoChannelRedirectTarget('/videos/1.htm', '')).toBeNull();
  });
});

describe('legacyVedioDetailRedirectTarget', () => {
  it('maps detail and play', () => {
    expect(legacyVedioDetailRedirectTarget('/vedio/12.htm')).toBe('/video/12.htm');
    expect(legacyVedioDetailRedirectTarget('/vedio/12')).toBe('/video/12.htm');
    expect(legacyVedioDetailRedirectTarget('/vedio/12/play')).toBe('/video/12/play');
  });
});
