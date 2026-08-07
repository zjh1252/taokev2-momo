import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TRAINER_LIST_RETURN_KEY,
  TRAINER_LIST_SCROLL_KEY,
  consumeTrainerListScroll,
  hasTrainerSlugState,
  isSafeTrainerListPath,
  readTrainerListReturnPath,
  readTrainerListSlugFromBrowser,
  rememberTrainerListPath,
  rememberTrainerListScroll,
} from './list-return';

function createStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe('trainer list return path', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: { pathname: '/trainer', search: '' },
      scrollY: 0,
    });
    vi.stubGlobal('sessionStorage', createStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('treats trainer list paths as safe and rejects detail pages', () => {
    expect(isSafeTrainerListPath('/trainer')).toBe(true);
    expect(isSafeTrainerListPath('/trainer?field=leadership')).toBe(true);
    expect(isSafeTrainerListPath('/trainer/field=leadership.htm')).toBe(true);
    expect(isSafeTrainerListPath('/city/beijing/trainers')).toBe(true);
    expect(isSafeTrainerListPath('/trainer/123.htm')).toBe(false);
    expect(isSafeTrainerListPath('/trainer/123/courses.htm')).toBe(false);
  });

  it('remembers and restores a safe list path', () => {
    rememberTrainerListPath('/trainer/field=leadership.htm');

    expect(sessionStorage.getItem(TRAINER_LIST_RETURN_KEY)).toBe(
      '/trainer/field=leadership.htm',
    );
    expect(readTrainerListReturnPath()).toBe('/trainer/field=leadership.htm');
  });

  it('strips locale prefix when remembering return path', () => {
    rememberTrainerListPath('/zh-CN/trainer/field=leadership.htm');
    expect(readTrainerListReturnPath()).toBe('/trainer/field=leadership.htm');
  });

  it('ignores unsafe paths and falls back to the default list path', () => {
    rememberTrainerListPath('/trainer/123.htm');
    expect(sessionStorage.getItem(TRAINER_LIST_RETURN_KEY)).toBeNull();

    sessionStorage.setItem(TRAINER_LIST_RETURN_KEY, '/trainer/123.htm');
    expect(readTrainerListReturnPath()).toBe('/trainer');
  });

  it('stores and consumes scroll position once', () => {
    rememberTrainerListScroll(640);
    expect(sessionStorage.getItem(TRAINER_LIST_SCROLL_KEY)).toBe('640');
    expect(consumeTrainerListScroll()).toBe(640);
    expect(consumeTrainerListScroll()).toBeNull();
  });

  it('reads page/filters from .htm path', () => {
    vi.stubGlobal('window', {
      location: {
        pathname: '/trainer/field=%E4%BA%92%E8%81%94%E7%BD%91&page=2.htm',
        search: '',
      },
      scrollY: 0,
    });
    expect(readTrainerListSlugFromBrowser()).toEqual({
      field: '互联网',
      page: 2,
    });
  });

  it('falls back to session list path when address bar lost page state', () => {
    rememberTrainerListPath('/trainer/field=经营战略&page=2.htm');
    vi.stubGlobal('window', {
      location: { pathname: '/trainer', search: '' },
      scrollY: 0,
    });
    expect(readTrainerListSlugFromBrowser()).toEqual({
      field: '经营战略',
      page: 2,
    });
  });

  it('hasTrainerSlugState detects page and filters', () => {
    expect(hasTrainerSlugState({})).toBe(false);
    expect(hasTrainerSlugState({ page: 1 })).toBe(false);
    expect(hasTrainerSlugState({ page: 2 })).toBe(true);
    expect(hasTrainerSlugState({ field: '互联网' })).toBe(true);
  });
});
