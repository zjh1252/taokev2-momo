'use client';

import { useState, useCallback } from 'react';
import { storage } from '@/lib/storage';
import { useAuth } from '@/lib/auth/auth-context';
import type { ApplyableRole } from '../api/types';

/** 新用户待弹窗标记（短暂跨页面传递用） */
const PENDING_KEY = 'taoke_new_user_pending';

function storageKey(userId: number | undefined) {
  return `taoke_role_apply_${userId ?? 'anon'}`;
}

function dismissedKey(userId: number | undefined) {
  return `taoke_role_apply_dismissed_${userId ?? 'anon'}`;
}

export interface RoleApplyState {
  selectedRole: ApplyableRole | null;
  formData: Record<string, unknown>;
}

/**
 * 角色申请流程状态管理 Hook — 按 userId 隔离持久化到 localStorage
 *
 * @author Fangxinxin
 * @date 2026-04-03 15:00
 */
export function useRoleApplyState() {
  const { user } = useAuth();
  const uid = user?.id;

  const [state, setStateInner] = useState<RoleApplyState>(() => {
    const saved = storage.get<RoleApplyState>(storageKey(uid));
    return saved || { selectedRole: null, formData: {} };
  });

  const persist = useCallback((next: RoleApplyState) => {
    storage.set(storageKey(uid), next);
    setStateInner(next);
  }, [uid]);

  const setSelectedRole = useCallback(
    (role: ApplyableRole) => {
      persist({ ...state, selectedRole: role, formData: defaultFormData(role) });
    },
    [state, persist],
  );

  const setFormData = useCallback(
    (data: Record<string, unknown>) => {
      persist({ ...state, formData: data });
    },
    [state, persist],
  );

  const clearState = useCallback(() => {
    storage.remove(storageKey(uid));
    setStateInner({ selectedRole: null, formData: {} });
  }, [uid]);

  const dismiss = useCallback(() => {
    storage.set(dismissedKey(uid), true);
    clearState();
  }, [uid, clearState]);

  const isDismissed = useCallback(() => {
    return !!storage.get<boolean>(dismissedKey(uid));
  }, [uid]);

  return {
    state,
    setSelectedRole,
    setFormData,
    clearState,
    dismiss,
    isDismissed,
  };
}

/** 提供各角色表单的初始默认值（确保数组 / 布尔 / 版本号等字段就绪） */
function defaultFormData(role: ApplyableRole): Record<string, unknown> {
  switch (role) {
    case 'TRAINER':
      return {
        name: '',
        teachingName: '',
        avatar: '',
        title: '',
        gender: 0,
        phone: '',
        email: '',
        provinceId: null,
        cityId: null,
        districtId: null,
        address: '',
        oneLineIntro: '',
        bio: '',
        background: '',
        partialClients: '',
        goodAt: '',
        industryCategoryIds: [],
        expertiseCategoryIds: [],
        expertiseTags: '',
        teachingStyle: '',
        experienceYears: null,
        teachingYears: null,
        quoteMin: null,
        quoteMax: null,
        quoteUnit: '',
        quoteRemark: '',
        taokePrice: null,
        taokeCommission: null,
        books: [],
        agreementSigned: false,
        agreementVersion: 'v1',
        resumeUrl: '',
      };
    case 'AGENT':
      return {
        realName: '',
        contactPhone: '',
        email: '',
        serviceCities: [],
        enterpriseAgentId: null,
        agreementSigned: false,
        agreementVersion: 'v1',
      };
    case 'ASSISTANT':
      return {
        realName: '',
        contactPhone: '',
        email: '',
        serviceCities: [],
        agreementSigned: false,
        agreementVersion: 'v1',
      };
    case 'ENTERPRISE_AGENT':
      return {
        companyName: '',
        licenseNo: '',
        legalPerson: '',
        industry: '',
        companySize: '',
        bio: '',
        contactName: '',
        contactPhone: '',
        provinceId: null,
        cityId: null,
        districtId: null,
        townId: null,
        address: '',
        qualificationDocUrl: '',
        agreementSigned: false,
        agreementVersion: 'v1',
      };
    case 'INSTITUTION':
      return {
        orgName: '',
        orgType: 0,
        legalRepresentative: '',
        licenseNo: '',
        establishedAt: '',
        logoUrl: '',
        bio: '',
        industryCategoryIds: [],
        expertiseCategoryIds: [],
        clientCases: '',
        hasVenue: 0,
        hasExperts: 0,
        contactName: '',
        contactPhone: '',
        showContact: 0,
        provinceId: null,
        cityId: null,
        districtId: null,
        townId: null,
        address: '',
        agreementSigned: false,
        agreementVersion: 'v1',
      };
    case 'INSTITUTION_EMPLOYEE':
      return {
        realName: '',
        contactPhone: '',
        email: '',
        serviceCities: [],
        orgId: null,
        agreementSigned: false,
        agreementVersion: 'v1',
      };
    default:
      return {};
  }
}

/** 标记新用户待弹窗（LoginForm 调用） */
export function markNewUserPending() {
  storage.set(PENDING_KEY, true);
}

/** 消费并清除新用户待弹窗标记 */
export function consumeNewUserPending(): boolean {
  const pending = !!storage.get<boolean>(PENDING_KEY);
  if (pending) storage.remove(PENDING_KEY);
  return pending;
}
