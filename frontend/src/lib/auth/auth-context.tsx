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
import { ROLE_TRAINER, ROLE_INSTITUTION } from './constants';
import { clearAuthTokens, getAccessToken } from './token';
import { resolveImageSrc } from '@/lib/media';
import { getMyProfile } from '@/features/user/api/service';
import { getMyTrainerProfile } from '@/features/trainer/api/service';
import { getMyInstitutionProfile } from '@/features/institution/api/service';
import { institutionPublicHref } from '@/features/institution/utils/public-path';
import type { UserProfileResponse, RoleInfo } from '@/features/user/api/types';

/** 精简后的认证用户信息 */
export interface AuthUser {
  id: number;
  nickname: string;
  realName: string | null;
  avatarUrl: string | null;
  phone: string;
  studyTags: string | null;
  /** 是否老站迁移账号 */
  oldUser?: boolean;
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
  /** 专家公开主页路径（如 /trainer/123），非已生效专家或未拉到档案时为 null */
  trainerPublicHomeHref: string | null;
  /** 机构公开主页路径（如 /company/5），非已生效机构时为 null */
  institutionPublicHomeHref: string | null;
  /**
   * 当前 activeRole 对应的公开主页路径，仅 TRAINER / INSTITUTION 有值
   */
  publicHomeHref: string | null;
  /** 专家编号（如 TK-A1B2C3），非专家为 null */
  trainerCode: string | null;
  /** 当前激活的身份角色编码 */
  activeRole: string;
  /** 切换当前身份 */
  setActiveRole: (role: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** 从后端 UserProfileResponse 映射为前端 AuthUser */
function toAuthUser(profile: UserProfileResponse): AuthUser {
  return {
    id: profile.id,
    nickname: profile.nickname || profile.phone || '用户',
    realName: profile.realName || null,
    avatarUrl: profile.avatarUrl?.trim()
      ? resolveImageSrc(profile.avatarUrl)
      : null,
    phone: profile.phone,
    studyTags: profile.studyTags || null,
    oldUser: profile.oldUser === true,
    roles: profile.roles,
  };
}

/** 是否已生效的专家角色 */
function isApprovedTrainer(roles: RoleInfo[]): boolean {
  return roles.some((r) => r.role === ROLE_TRAINER && r.status === 1);
}

/** 是否已生效的机构角色 */
function isApprovedInstitution(roles: RoleInfo[]): boolean {
  return roles.some((r) => r.role === ROLE_INSTITUTION && r.status === 1);
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
  const [institutionPublicHomeHref, setInstitutionPublicHomeHref] = useState<string | null>(null);
  const [trainerCode, setTrainerCode] = useState<string | null>(null);
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
      setInstitutionPublicHomeHref(null);
      setLoading(false);
      return;
    }

    setTrainerPublicHomeHref(null);
    setInstitutionPublicHomeHref(null);
    setTrainerCode(null);
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
          setTrainerPublicHomeHref(`/trainer/${me.id}.htm`);
          setTrainerCode(me.trainerCode || null);
        } catch {
          setTrainerPublicHomeHref(null);
        }
      }

      if (isApprovedInstitution(authUser.roles)) {
        try {
          const inst = await getMyInstitutionProfile();
          setInstitutionPublicHomeHref(institutionPublicHref(inst));
        } catch {
          setInstitutionPublicHomeHref(null);
        }
      }
    } catch {
      clearAuthTokens();
      setUser(null);
      setTrainerPublicHomeHref(null);
      setInstitutionPublicHomeHref(null);
      setTrainerCode(null);
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
    clearAuthTokens();
    setUser(null);
    setTrainerPublicHomeHref(null);
    setInstitutionPublicHomeHref(null);
    window.location.href = '/';
  }, []);

  // 根据当前 activeRole 计算对应的公开主页链接
  const publicHomeHref =
    activeRole === ROLE_TRAINER
      ? trainerPublicHomeHref
      : activeRole === ROLE_INSTITUTION
        ? institutionPublicHomeHref
        : null;

  return (
    <AuthContext.Provider
      value={{
        user, loading, refreshUser, logout,
        trainerPublicHomeHref, institutionPublicHomeHref, publicHomeHref,
        trainerCode, activeRole, setActiveRole,
      }}
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

/** 可选认证（弹窗等场景，无 Provider 时不抛错） */
export function useAuthOptional(): AuthContextValue | null {
  return useContext(AuthContext);
}
