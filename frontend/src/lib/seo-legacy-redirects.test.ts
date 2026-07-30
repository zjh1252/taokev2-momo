import { describe, expect, it } from 'vitest';
import {
  isLegacyNumericTrainerFilterPath,
  legacyCitiesHomeRedirectTarget,
  legacyVideoChannelRedirectTarget,
  legacyVedioDetailRedirectTarget,
  legacyVideoPlayRedirectTarget,
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

describe('legacyVideoPlayRedirectTarget', () => {
  it('maps legacy video_play to /video/{id}/play', () => {
    expect(legacyVideoPlayRedirectTarget('/video_play/17946.htm')).toBe('/video/17946/play');
    expect(legacyVideoPlayRedirectTarget('/video_play/17946')).toBe('/video/17946/play');
    expect(legacyVideoPlayRedirectTarget('/video/17946/play')).toBeNull();
  });
});

describe('legacyCitiesHomeRedirectTarget', () => {
  it('maps /cities/{en} to /city/{en} keeping query', () => {
    expect(legacyCitiesHomeRedirectTarget('/cities/shanghai', '?x=1')).toBe(
      '/city/shanghai?x=1',
    );
    expect(legacyCitiesHomeRedirectTarget('/cities/beijing', '')).toBe('/city/beijing');
  });

  it('maps city subchannels to /city/{en}/{sub}', () => {
    expect(legacyCitiesHomeRedirectTarget('/cities/shanghai/opencourse', '')).toBe(
      '/city/shanghai/opencourse',
    );
    expect(legacyCitiesHomeRedirectTarget('/cities/beijing/institutions', '?p=1')).toBe(
      '/city/beijing/institutions?p=1',
    );
    expect(legacyCitiesHomeRedirectTarget('/cities/suzhou/trainers', '')).toBe(
      '/city/suzhou/trainers',
    );
  });

  it('ignores API-like paths and /city', () => {
    expect(legacyCitiesHomeRedirectTarget('/cities/active', '')).toBeNull();
    expect(legacyCitiesHomeRedirectTarget('/cities/shanghai/home', '')).toBeNull();
    expect(legacyCitiesHomeRedirectTarget('/city/shanghai', '')).toBeNull();
    expect(legacyCitiesHomeRedirectTarget('/city/shanghai/opencourse', '')).toBeNull();
    expect(legacyCitiesHomeRedirectTarget('/cities', '')).toBeNull();
  });
});
