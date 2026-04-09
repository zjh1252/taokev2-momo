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
import { TOKEN_KEY, ROLE_TRAINER } from './constants';
import { getMyProfile } from '@/features/user/api/service';
import { getMyTrainerProfile } from '@/features/trainer/api/service';
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
  /**
   * 专家公开主页路径（如 /trainers/123），非已生效专家或未拉到档案时为 null
   */
  trainerPublicHomeHref: string | null;
  /** 当前激活的身份角色编码 */
  activeRole: string;
  /** 切换当前身份 */
  setActiveRole: (role: string) => void;
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

/** 是否已生效的专家角色（顶栏才展示「我的主页」） */
function isApprovedTrainer(roles: RoleInfo[]): boolean {
  return roles.some((r) => r.role === ROLE_TRAINER && r.status === 1);
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
const ACTIVE_ROLE_KEY = 'taoke_active_role';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [trainerPublicHomeHref, setTrainerPublicHomeHref] = useState<string | null>(null);
  const [activeRole, setActiveRoleState] = useState<string>('BUYER');

  const setActiveRole = useCallback((role: string) => {
    setActiveRoleState(role);
    storage.set(ACTIVE_ROLE_KEY, role);
  }, []);

  const fetchUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setTrainerPublicHomeHref(null);
      setLoading(false);
      return;
    }

    setTrainerPublicHomeHref(null);
    try {
      const res = await getMyProfile(token);
      const authUser = toAuthUser(res.data);
      setUser(authUser);

      const savedRole = storage.get<string>(ACTIVE_ROLE_KEY);
      if (savedRole && authUser.roles.some((r) => r.role === savedRole && r.status === 1)) {
        setActiveRoleState(savedRole);
      } else {
        setActiveRoleState('BUYER');
      }

      if (isApprovedTrainer(authUser.roles)) {
        try {
          const me = await getMyTrainerProfile();
          setTrainerPublicHomeHref(`/trainers/${me.id}`);
        } catch {
          setTrainerPublicHomeHref(null);
        }
      }
    } catch {
      // token 无效或过期，清理本地存储
      storage.remove(TOKEN_KEY);
      setUser(null);
      setTrainerPublicHomeHref(null);
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
    setTrainerPublicHomeHref(null);
    window.location.href = '/';
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, refreshUser, logout, trainerPublicHomeHref, activeRole, setActiveRole }}
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
