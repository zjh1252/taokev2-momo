import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import type {
  UcIdentityField,
  UcMemberLinkItem,
  UcMemberLookupResult,
  UcOrgLink,
  UcOrgType,
} from './types';

interface ApiResponse<T> {
  code: string;
  message?: string;
  data: T;
}

const PATH_PREFIX: Record<UcOrgType, string> = {
  INSTITUTION: '/institutions/me',
  ENTERPRISE_AGENT: '/enterprise-agents/me',
  ENTERPRISE_BUYER: '/enterprise-buyers/me',
};

function authHeaders(): Record<string, string> {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return { Authorization: `Bearer ${tokenData?.accessToken || ''}` };
}

function prefix(orgType: UcOrgType): string {
  return PATH_PREFIX[orgType];
}

export async function getUcOrgLink(orgType: UcOrgType): Promise<UcOrgLink | null> {
  const res = await apiGet<ApiResponse<UcOrgLink | null>>(`${prefix(orgType)}/uc-link`, {
    headers: authHeaders(),
    silent: true,
  });
  return res.data;
}

export async function saveUcOrgLink(orgType: UcOrgType, ucPRootId: number): Promise<UcOrgLink> {
  const res = await apiPut<ApiResponse<UcOrgLink>>(`${prefix(orgType)}/uc-link`, { ucPRootId }, {
    headers: authHeaders(),
    silent: true,
  });
  return res.data;
}

export async function deleteUcOrgLink(orgType: UcOrgType): Promise<void> {
  await apiDelete<ApiResponse<null>>(`${prefix(orgType)}/uc-link`, {
    headers: authHeaders(),
    silent: true,
  });
}

const EMPLOYEE_BIND_PATH: Partial<Record<UcOrgType, string>> = {
  INSTITUTION: '/institutions/me/employees',
  ENTERPRISE_AGENT: '/enterprise-agents/me/members',
};

export async function bindEmployeeUcMember(
  orgType: UcOrgType,
  bindingId: number,
  identityValue: string,
): Promise<UcMemberLinkItem> {
  const base = EMPLOYEE_BIND_PATH[orgType];
  if (!base) {
    throw new Error('该组织类型不支持员工 UC 绑定');
  }
  const res = await apiPost<ApiResponse<UcMemberLinkItem>>(
    `${base}/${bindingId}/uc-member`,
    { identityValue },
    { headers: authHeaders(), silent: true },
  );
  return res.data;
}

export async function unbindEmployeeUcMember(orgType: UcOrgType, bindingId: number): Promise<void> {
  const base = EMPLOYEE_BIND_PATH[orgType];
  if (!base) {
    throw new Error('该组织类型不支持员工 UC 绑定');
  }
  await apiDelete<ApiResponse<null>>(`${base}/${bindingId}/uc-member`, {
    headers: authHeaders(),
    silent: true,
  });
}

export async function getUcIdentityField(orgType: UcOrgType): Promise<UcIdentityField> {
  const res = await apiGet<ApiResponse<UcIdentityField>>(`${prefix(orgType)}/uc-link/identity-field`, {
    headers: authHeaders(),
    silent: true,
  });
  return res.data;
}

export async function lookupUcMember(
  orgType: UcOrgType,
  identityValue: string,
): Promise<UcMemberLookupResult> {
  const res = await apiPost<ApiResponse<UcMemberLookupResult>>(
    `${prefix(orgType)}/uc-members/lookup`,
    { identityValue },
    { headers: authHeaders(), silent: true },
  );
  return res.data;
}

export async function syncUcMemberProfile(
  orgType: UcOrgType,
  memberLinkId: number,
): Promise<Record<string, unknown>> {
  const res = await apiPost<ApiResponse<Record<string, unknown>>>(
    `${prefix(orgType)}/uc-members/${memberLinkId}/sync-profile`,
    undefined,
    { headers: authHeaders(), silent: true },
  );
  return res.data;
}

export async function listUcMembers(orgType: UcOrgType): Promise<UcMemberLinkItem[]> {
  const res = await apiGet<ApiResponse<UcMemberLinkItem[]>>(`${prefix(orgType)}/uc-members`, {
    headers: authHeaders(),
    silent: true,
  });
  return res.data ?? [];
}
