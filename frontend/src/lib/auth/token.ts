import { storage } from '@/lib/storage';
import { TOKEN_KEY } from './constants';
import { ROUTES } from '@/config/routes';

/**
 * localStorage 中的登录凭证结构
 *
 * @author Fangxinxin
 * @date 2026-08-06 19:45
 */
export type StoredToken = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
};

/** HTTP cache 指令等绝不能当作 accessToken 的值 */
const INVALID_TOKEN_VALUES = new Set([
  '',
  'undefined',
  'null',
  'no-cache',
  'no-store',
  'reload',
  'force-cache',
  'only-if-cached',
]);

/**
 * 判断字符串是否为可用的 accessToken。
 * <p>拒绝空串、HTTP cache 指令（如 no-cache），以及过短的垃圾值。</p>
 */
export function isValidAccessToken(token: unknown): token is string {
  if (typeof token !== 'string') return false;
  const t = token.trim();
  if (!t) return false;
  if (INVALID_TOKEN_VALUES.has(t.toLowerCase())) return false;
  // 真实 JWT / opaque token 远长于此；过短基本是脏数据
  if (t.length < 16) return false;
  return true;
}

function readStoredToken(): StoredToken | null {
  // storage.get 内部已处理 SSR（无 window 时返回 null）
  return storage.get<StoredToken>(TOKEN_KEY);
}

/** 从 localStorage 同步读取合法 accessToken；脏数据会顺带清除 */
export function getAccessToken(): string | null {
  const data = readStoredToken();
  if (!data) return null;
  if (!isValidAccessToken(data.accessToken)) {
    // 存储被污染（例如误写入 no-cache）时立即清除，避免反复带坏 Authorization
    storage.remove(TOKEN_KEY);
    return null;
  }
  return data.accessToken.trim();
}

/** 登录成功后写入凭证 */
export function setAuthTokens(token: StoredToken): void {
  if (!isValidAccessToken(token.accessToken)) {
    throw new Error('Invalid access token');
  }
  storage.set(TOKEN_KEY, {
    accessToken: token.accessToken.trim(),
    refreshToken: token.refreshToken,
    expiresIn: token.expiresIn,
    tokenType: token.tokenType || 'Bearer',
  });
}

/** 清除本地登录凭证 */
export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return;
  storage.remove(TOKEN_KEY);
}

/**
 * 构造 Authorization 头。
 * <p>仅在存在合法 token 时返回；禁止返回 {@code Bearer } / {@code Bearer no-cache}。</p>
 */
export function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** 从 Authorization 头解析 Bearer token */
export function parseBearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const matched = authorization.match(/^Bearer\s+(.+)$/i);
  const raw = (matched ? matched[1] : authorization).trim();
  return isValidAccessToken(raw) ? raw : null;
}

/**
 * 跳转登录页（带 redirect），供 token 缺失 / 401 时调用。
 * <p>C 端登录态只存 localStorage，不依赖 Cookie；此处不做 Cookie 读写。</p>
 */
export function redirectToLogin(): void {
  if (typeof window === 'undefined') return;
  clearAuthTokens();
  const { pathname, search } = window.location;
  // localePrefix=as-needed：默认语言无前缀；若有 /zh|/en 前缀则剥掉再作为 redirect
  const stripped = pathname.replace(/^\/(zh|en)(?=\/|$)/, '') || '/';
  const target = `${stripped}${search}`;
  const loginUrl = `${ROUTES.LOGIN}?redirect=${encodeURIComponent(target)}`;
  window.location.assign(loginUrl);
}
