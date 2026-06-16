import { apiPost } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import { getApiBaseUrl } from '@/lib/env/client';
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

/** 简历解析返回结构（与后端 ResumeParseResult 对齐） */
export interface ResumeParseResult {
  realName?: string;
  teachingName?: string;
  oneLineIntro?: string;
  credential?: string;
  partialClients?: string;
  phone?: string;
  email?: string;
  bio?: string;
  background?: string;
  teachingStyle?: string;
  videos?: string[];
  specialties?: string[];
  industries?: string[];
  resumeUrl?: string;
}

/** 简历上传 + 解析（multipart/form-data） */
export async function uploadAndParseResume(file: File): Promise<{
  fileUrl: string;
  parseResult: ResumeParseResult;
}> {
  const formData = new FormData();
  formData.append('file', file);
  const resp = await fetch(`${getApiBaseUrl()}/trainers/me/resume/parse-and-upload`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  if (!resp.ok) {
    let message = '简历上传或解析失败';
    try {
      const err = (await resp.json()) as { message?: string };
      if (err?.message) message = err.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const json = (await resp.json()) as {
    data: { fileUrl: string; parseResult: ResumeParseResult };
  };
  return json.data;
}

/** 已上传简历再次按 URL 重新解析（不重新上传） */
export function parseResumeByUrl(fileUrl: string) {
  return apiPost<ResumeParseResult>(
    '/trainers/me/resume/parse',
    { fileUrl },
    { headers: authHeaders() },
  );
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
