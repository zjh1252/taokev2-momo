import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@/lib/storage', () => {
  const store = new Map<string, string>();
  return {
    storage: {
      get<T>(key: string): T | null {
        const v = store.get(key);
        if (!v) return null;
        try {
          return JSON.parse(v) as T;
        } catch {
          return null;
        }
      },
      set(key: string, value: unknown) {
        store.set(key, JSON.stringify(value));
      },
      remove(key: string) {
        store.delete(key);
      },
      __store: store,
    },
  };
});

import { storage } from '@/lib/storage';
import { TOKEN_KEY } from './constants';
import {
  authHeaders,
  getAccessToken,
  isValidAccessToken,
  parseBearerToken,
  setAuthTokens,
} from './token';

describe('auth token helpers', () => {
  beforeEach(() => {
    (storage as unknown as { __store: Map<string, string> }).__store.clear();
  });

  afterEach(() => {
    (storage as unknown as { __store: Map<string, string> }).__store.clear();
  });

  it('rejects HTTP cache directives as tokens', () => {
    expect(isValidAccessToken('no-cache')).toBe(false);
    expect(isValidAccessToken('no-store')).toBe(false);
    expect(isValidAccessToken('')).toBe(false);
    expect(isValidAccessToken('short')).toBe(false);
  });

  it('accepts JWT-like access tokens', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signaturepart';
    expect(isValidAccessToken(jwt)).toBe(true);
  });

  it('purges polluted localStorage and never returns no-cache', () => {
    storage.set(TOKEN_KEY, { accessToken: 'no-cache' });
    expect(getAccessToken()).toBeNull();
    expect(storage.get(TOKEN_KEY)).toBeNull();
    expect(authHeaders()).toEqual({});
  });

  it('returns Authorization only for valid stored tokens', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signaturepart';
    setAuthTokens({ accessToken: jwt, refreshToken: 'r', expiresIn: 3600 });
    expect(getAccessToken()).toBe(jwt);
    expect(authHeaders()).toEqual({ Authorization: `Bearer ${jwt}` });
  });

  it('parseBearerToken rejects Bearer no-cache', () => {
    expect(parseBearerToken('Bearer no-cache')).toBeNull();
    expect(parseBearerToken('Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signaturepart')).toBe(
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signaturepart',
    );
  });
});
