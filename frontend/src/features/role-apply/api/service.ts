import { apiPost } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import type {
  ApplyableRole,
  EnterpriseBuyerFormData,
  TrainerFormData,
  AgentFormData,
  AssistantFormData,
  EnterpriseAgentFormData,
  InstitutionFormData,
  InstitutionEmployeeFormData,
} from './types';

/**
 * 各角色申请 API 封装
 *
 * @author Fangxinxin
 * @date 2026-04-03 15:00
 */

function authHeaders() {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return { Authorization: `Bearer ${tokenData?.accessToken || ''}` };
}

/** 企业培训采购方申请 */
export function applyEnterpriseBuyer(data: EnterpriseBuyerFormData) {
  return apiPost('/enterprise-buyers/apply', data, { headers: authHeaders() });
}

/** 专家申请 */
export function applyTrainer(data: TrainerFormData) {
  return apiPost('/trainers/apply', data, { headers: authHeaders() });
}

/** 专家经纪人申请 */
export function applyAgent(data: AgentFormData) {
  return apiPost('/agents/apply', data, { headers: authHeaders() });
}

/** 专家助理申请 */
export function applyAssistant(data: AssistantFormData) {
  return apiPost('/assistants/apply', data, { headers: authHeaders() });
}

/** 专家经纪公司申请 */
export function applyEnterpriseAgent(data: EnterpriseAgentFormData) {
  return apiPost('/enterprise-agents/apply', data, { headers: authHeaders() });
}

/** 机构申请 */
export function applyInstitution(data: InstitutionFormData) {
  return apiPost('/institutions/apply', data, { headers: authHeaders() });
}

/** 机构员工申请 */
export function applyInstitutionEmployee(data: InstitutionEmployeeFormData) {
  return apiPost('/institution-employees/apply', data, { headers: authHeaders() });
}

/** 根据角色编码调用对应的申请 API */
export function submitRoleApply(role: ApplyableRole, data: Record<string, unknown>) {
  const handlers: Record<ApplyableRole, (d: any) => Promise<unknown>> = {
    ENTERPRISE_BUYER: applyEnterpriseBuyer,
    TRAINER: applyTrainer,
    AGENT: applyAgent,
    ASSISTANT: applyAssistant,
    ENTERPRISE_AGENT: applyEnterpriseAgent,
    INSTITUTION: applyInstitution,
    INSTITUTION_EMPLOYEE: applyInstitutionEmployee,
  };
  return handlers[role](data);
}
