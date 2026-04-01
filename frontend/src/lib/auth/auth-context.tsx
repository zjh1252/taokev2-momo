'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { storage } from '@/lib/storage';
import { TOKEN_KEY, PUBLIC_PROFILE_ROLES } from './constants';
import { getMyProfile } from '@/features/user/api/service';
import type { UserProfileResponse, RoleInfo } from '@/features/user/api/types';

/** 精简后的认证用户信息 */
export interface AuthUser {
  id: number;
  nickname: string;
  avatarUrl: string | null;
  phone: string;
  roles: RoleInfo[];
}

interface AuthContextValue {
  /** 当前登录用户，null 表示未登录 */
  user: AuthUser | null;
  /** 正在加载用户信息（首次挂载时） */
  loading: boolean;
  /** 重新拉取用户信息（登录成功后调用） */
  refreshUser: () => Promise<void>;
  /** 退出登录 */
  logout: () => void;
  /** 判断当前用户是否拥有公开主页（专家/机构/机构员工） */
  hasPublicProfile: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** 从存储中读取 accessToken */
function getAccessToken(): string | null {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return tokenData?.accessToken ?? null;
}

/** 从后端 UserProfileResponse 映射为前端 AuthUser */
function toAuthUser(profile: UserProfileResponse): AuthUser {
  return {
    id: profile.id,
    nickname: profile.nickname || profile.phone || '用户',
    avatarUrl: profile.avatarUrl || null,
    phone: profile.phone,
    roles: profile.roles,
  };
}

/** 判断角色列表中是否包含拥有公开主页的角色（且状态为生效） */
function checkHasPublicProfile(roles: RoleInfo[]): boolean {
  return roles.some(
    (r) =>
      PUBLIC_PROFILE_ROLES.includes(r.role as (typeof PUBLIC_PROFILE_ROLES)[number]) &&
      r.status === 1,
  );
}

/**
 * 全局认证状态 Provider
 * <p>
 * 挂载时从 localStorage 读取 token，若存在则请求 /users/me 获取用户信息。
 * 提供 user / loading / refreshUser / logout 给子组件使用。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-01 22:00
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await getMyProfile(token);
      setUser(toAuthUser(res.data));
    } catch {
      // token 无效或过期，清理本地存储
      storage.remove(TOKEN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    await fetchUser();
  }, [fetchUser]);

  const logout = useCallback(() => {
    storage.remove(TOKEN_KEY);
    setUser(null);
    window.location.href = '/';
  }, []);

  const hasPublicProfile = user ? checkHasPublicProfile(user.roles) : false;

  return (
    <AuthContext.Provider
      value={{ user, loading, refreshUser, logout, hasPublicProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 获取当前认证状态的 Hook
 * <p>必须在 AuthProvider 内部使用</p>
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth 必须在 AuthProvider 内部使用');
  }
  return ctx;
}
