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
  // silent: true 让调用方自行 toast，避免与 apiClient 的全局 toast 叠加成两次提示
  const res = await apiPost<ApiResponse<BindingItem>>(`/bindings`, payload, {
    headers: authHeaders(),
    silent: true,
  });
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

export async function confirmBindingByAgent(id: number): Promise<void> {
  await apiPost<ApiResponse<null>>(`/agents/me/bindings/${id}/confirm`, undefined, {
    headers: authHeaders(),
  });
}

export async function rejectBindingByAgent(id: number, reason?: string): Promise<void> {
  await apiPost<ApiResponse<null>>(`/agents/me/bindings/${id}/reject`, { reason }, {
    headers: authHeaders(),
  });
}

/* ---- 机构 / 经纪公司侧的审核别名（语义更清晰）---- */
export async function approveEmployeeByInstitution(id: number): Promise<void> {
  await apiPost<ApiResponse<null>>(`/institutions/me/employees/${id}/approve`, undefined, {
    headers: authHeaders(),
  });
}

export async function rejectEmployeeByInstitution(id: number, reason?: string): Promise<void> {
  await apiPost<ApiResponse<null>>(`/institutions/me/employees/${id}/reject`, { reason }, {
    headers: authHeaders(),
  });
}

export async function approveAgentByEnterprise(id: number): Promise<void> {
  await apiPost<ApiResponse<null>>(`/enterprise-agents/me/members/${id}/approve`, undefined, {
    headers: authHeaders(),
  });
}

export async function rejectAgentByEnterprise(id: number, reason?: string): Promise<void> {
  await apiPost<ApiResponse<null>>(`/enterprise-agents/me/members/${id}/reject`, { reason }, {
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

/** 经纪公司：我的经纪人（含 ACTIVE/PENDING/REJECTED/UNBOUND） */
export async function listEnterpriseAgentMembers(): Promise<BindingItem[]> {
  const res = await apiGet<ApiResponse<BindingItem[]>>(`/enterprise-agents/me/members`, {
    headers: authHeaders(),
  });
  return res.data || [];
}

/** 经纪人：我的经纪公司（含 ACTIVE/PENDING/REJECTED/UNBOUND） */
export async function listMyEnterpriseAgents(): Promise<BindingItem[]> {
  const res = await apiGet<ApiResponse<BindingItem[]>>(`/agents/me/enterprises`, {
    headers: authHeaders(),
  });
  return res.data || [];
}

/** 员工：我的机构（含 ACTIVE/PENDING/REJECTED/UNBOUND） */
export async function listMyInstitutions(): Promise<BindingItem[]> {
  const res = await apiGet<ApiResponse<BindingItem[]>>(`/employees/me/institutions`, {
    headers: authHeaders(),
  });
  return res.data || [];
}

/** 机构员工：所属机构绑定的专家（含 ACTIVE/PENDING/REJECTED/UNBOUND） */
export async function listEmployeeInstitutionTrainers(): Promise<BindingItem[]> {
  const res = await apiGet<ApiResponse<BindingItem[]>>(`/employees/me/institution-trainers`, {
    headers: authHeaders(),
  });
  return res.data || [];
}

export interface LookupUserResult {
  id: number;
  nickname?: string;
  avatarUrl?: string;
  phone?: string;
  /** 是否为「审核通过」的专家（绑定专家仅允许添加已通过审核的专家） */
  approvedTrainer?: boolean;
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
