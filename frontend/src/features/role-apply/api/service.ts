import { apiGet, apiPost } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import { getApiBaseUrl } from '@/lib/env/client';
import type {
  ApplyableRole,
  EnterpriseBuyerFormData,
  TrainerFormData,
  TrainerBookFormItem,
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

// ===== 已生效角色的「修改资料」入口：拉完整档案并转换为表单结构 =====

/** 后端 TrainerResponse 关键字段（与 com.taoke.user.dto.trainer.TrainerResponse 对齐，只声明回写需要的字段） */
interface TrainerFullProfile {
  name?: string;
  teachingName?: string;
  avatar?: string;
  title?: string;
  gender?: number;
  phone?: string;
  email?: string;
  idCardNo?: string;
  provinceId?: number;
  cityId?: number;
  districtId?: number;
  address?: string;
  bio?: string;
  oneLineIntro?: string;
  background?: string;
  partialClients?: string;
  goodAt?: string;
  expertiseTags?: string;
  teachingStyle?: string;
  experienceYears?: number;
  teachingYears?: number;
  quoteMin?: number;
  quoteMax?: number;
  quoteUnit?: string;
  quoteRemark?: string;
  taokePrice?: number;
  taokeCommission?: number;
  agreementVersion?: string;
  resumeUrl?: string;
  expertiseCategories?: { categoryId: number }[];
  industryCategories?: { categoryId: number }[];
  books?: TrainerBookFormItem[];
}

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * 拉取当前专家完整档案并转换为申请表单数据结构。
 * <p>用于已生效（status=1）或被驳回（status=3）的用户进入 /dashboard/apply/TRAINER
 * 时回写表单，避免重新填写。未拥有专家档案时返回 null。</p>
 */
export async function getMyTrainerProfileAsForm(): Promise<Partial<TrainerFormData> | null> {
  try {
    const res = await apiGet<ApiResponse<TrainerFullProfile>>('/trainers/me', {
      headers: authHeaders(),
      silent: true,
    });
    const t = res.data;
    if (!t) return null;
    return {
      name: t.name ?? '',
      teachingName: t.teachingName ?? '',
      avatar: t.avatar ?? '',
      title: t.title ?? '',
      gender: t.gender ?? 0,
      phone: t.phone ?? '',
      email: t.email ?? '',
      idCardNo: t.idCardNo ?? '',
      provinceId: t.provinceId ?? null,
      cityId: t.cityId ?? null,
      districtId: t.districtId ?? null,
      address: t.address ?? '',
      bio: t.bio ?? '',
      oneLineIntro: t.oneLineIntro ?? '',
      background: t.background ?? '',
      partialClients: t.partialClients ?? '',
      goodAt: t.goodAt ?? '',
      expertiseTags: t.expertiseTags ?? '',
      teachingStyle: t.teachingStyle ?? '',
      experienceYears: t.experienceYears ?? null,
      teachingYears: t.teachingYears ?? null,
      quoteMin: t.quoteMin ?? null,
      quoteMax: t.quoteMax ?? null,
      quoteUnit: t.quoteUnit ?? '',
      quoteRemark: t.quoteRemark ?? '',
      taokePrice: t.taokePrice ?? null,
      taokeCommission: t.taokeCommission ?? null,
      resumeUrl: t.resumeUrl ?? '',
      agreementVersion: t.agreementVersion ?? 'v1',
      // 已有档案的用户视为「已同意协议」预勾选（仍需用户确认提交）
      agreementSigned: true,
      industryCategoryIds: (t.industryCategories ?? []).map((c) => c.categoryId),
      expertiseCategoryIds: (t.expertiseCategories ?? []).map((c) => c.categoryId),
      books: t.books ?? [],
    };
  } catch {
    return null;
  }
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
