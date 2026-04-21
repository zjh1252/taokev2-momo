import { apiGet, apiPost } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import type { BindingItem, BindingType, InitiateBindingPayload } from './types';

interface ApiResponse<T> {
  code: string;
  message?: string;
  data: T;
}

function authHeaders(): Record<string, string> {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return { Authorization: `Bearer ${tokenData?.accessToken || ''}` };
}

/* ==================== 发起 / 确认 / 拒绝 / 解绑 ==================== */

export async function initiateBinding(payload: InitiateBindingPayload): Promise<BindingItem> {
  const res = await apiPost<ApiResponse<BindingItem>>(`/bindings`, payload, { headers: authHeaders() });
  return res.data;
}

export async function confirmBindingByTrainer(type: BindingType, id: number): Promise<void> {
  await apiPost<ApiResponse<null>>(`/trainers/me/bindings/${type}/${id}/confirm`, undefined, {
    headers: authHeaders(),
  });
}

export async function rejectBindingByTrainer(
  type: BindingType,
  id: number,
  reason?: string,
): Promise<void> {
  await apiPost<ApiResponse<null>>(`/trainers/me/bindings/${type}/${id}/reject`, { reason }, {
    headers: authHeaders(),
  });
}

export async function confirmBindingByEmployee(id: number): Promise<void> {
  await apiPost<ApiResponse<null>>(`/employees/me/bindings/${id}/confirm`, undefined, {
    headers: authHeaders(),
  });
}

export async function rejectBindingByEmployee(id: number, reason?: string): Promise<void> {
  await apiPost<ApiResponse<null>>(`/employees/me/bindings/${id}/reject`, { reason }, {
    headers: authHeaders(),
  });
}

export async function unbind(type: BindingType, id: number): Promise<void> {
  await apiPost<ApiResponse<null>>(`/bindings/${type}/${id}/unbind`, undefined, {
    headers: authHeaders(),
  });
}

/* ==================== 各角色查询 ==================== */

export async function listMyAgents(): Promise<BindingItem[]> {
  const res = await apiGet<ApiResponse<BindingItem[]>>(`/trainers/me/agents`, {
    headers: authHeaders(),
  });
  return res.data || [];
}

export async function listMyBindingRequests(): Promise<BindingItem[]> {
  const res = await apiGet<ApiResponse<BindingItem[]>>(`/trainers/me/binding-requests`, {
    headers: authHeaders(),
  });
  return res.data || [];
}

export async function listMyEmployeeRequests(): Promise<BindingItem[]> {
  const res = await apiGet<ApiResponse<BindingItem[]>>(`/employees/me/binding-requests`, {
    headers: authHeaders(),
  });
  return res.data || [];
}

export async function listManagedTrainers(): Promise<BindingItem[]> {
  const res = await apiGet<ApiResponse<BindingItem[]>>(`/me/managed-trainers`, {
    headers: authHeaders(),
  });
  return res.data || [];
}

export async function listInstitutionTrainers(): Promise<BindingItem[]> {
  const res = await apiGet<ApiResponse<BindingItem[]>>(`/institutions/me/trainers`, {
    headers: authHeaders(),
  });
  return res.data || [];
}

export async function listInstitutionEmployees(): Promise<BindingItem[]> {
  const res = await apiGet<ApiResponse<BindingItem[]>>(`/institutions/me/employees`, {
    headers: authHeaders(),
  });
  return res.data || [];
}

export async function listEnterpriseAgentTrainers(): Promise<BindingItem[]> {
  const res = await apiGet<ApiResponse<BindingItem[]>>(`/enterprise-agents/me/trainers`, {
    headers: authHeaders(),
  });
  return res.data || [];
}

export async function listAgentTrainers(): Promise<BindingItem[]> {
  const res = await apiGet<ApiResponse<BindingItem[]>>(`/agents/me/trainers`, {
    headers: authHeaders(),
  });
  return res.data || [];
}

export async function listAssistantTrainers(): Promise<BindingItem[]> {
  const res = await apiGet<ApiResponse<BindingItem[]>>(`/assistants/me/trainers`, {
    headers: authHeaders(),
  });
  return res.data || [];
}

export interface LookupUserResult {
  id: number;
  nickname?: string;
  avatarUrl?: string;
  phone?: string;
}

/** 按手机号查找平台用户（用于发起绑定时定位目标） */
export async function lookupUserByPhone(phone: string): Promise<LookupUserResult> {
  const qs = new URLSearchParams({ phone });
  const res = await apiGet<ApiResponse<LookupUserResult>>(`/bindings/users/lookup?${qs}`, {
    headers: authHeaders(),
    silent: true,
  });
  return res.data;
}
