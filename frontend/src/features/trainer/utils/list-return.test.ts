import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TRAINER_LIST_RETURN_KEY,
  isSafeTrainerListPath,
  readTrainerListReturnPath,
  rememberTrainerListPath,
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
    vi.stubGlobal('window', {});
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

  it('ignores unsafe paths and falls back to the default list path', () => {
    rememberTrainerListPath('/trainer/123.htm');
    expect(sessionStorage.getItem(TRAINER_LIST_RETURN_KEY)).toBeNull();

    sessionStorage.setItem(TRAINER_LIST_RETURN_KEY, '/trainer/123.htm');
    expect(readTrainerListReturnPath()).toBe('/trainer');
  });
});
