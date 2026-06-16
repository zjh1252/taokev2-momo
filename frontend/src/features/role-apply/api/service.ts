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
  ServiceCityItem,
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
  const payload = buildTrainerApplyPayload(data);
  return apiPost('/trainers/apply', payload, { headers: authHeaders() });
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** 提交前清洗：避免空字符串日期/数字导致后端 JSON 反序列化 500 */
function buildTrainerApplyPayload(data: TrainerFormData): TrainerFormData {
  const books = (data.books ?? [])
    .filter((b) => b?.title?.trim())
    .map((b) => {
      const item: TrainerBookFormItem = { title: b.title.trim() };
      if (b.coverUrl?.trim()) item.coverUrl = b.coverUrl.trim();
      if (b.publisher?.trim()) item.publisher = b.publisher.trim();
      if (b.publishDate?.trim()) item.publishDate = b.publishDate.trim();
      if (b.description?.trim()) item.description = b.description.trim();
      if (b.buyUrl?.trim()) item.buyUrl = b.buyUrl.trim();
      return item;
    });

  return {
    ...data,
    provinceId: toNumberOrNull(data.provinceId),
    cityId: toNumberOrNull(data.cityId),
    districtId: toNumberOrNull(data.districtId),
    townId: toNumberOrNull(data.townId),
    experienceYears: toNumberOrNull(data.experienceYears),
    teachingYears: toNumberOrNull(data.teachingYears),
    quoteMin: toNumberOrNull(data.quoteMin),
    quoteMax: toNumberOrNull(data.quoteMax),
    taokePrice: toNumberOrNull(data.taokePrice),
    taokeCommission: toNumberOrNull(data.taokeCommission),
    industryCategoryIds: (data.industryCategoryIds ?? [])
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id)),
    expertiseCategoryIds: (data.expertiseCategoryIds ?? [])
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id)),
    books,
  };
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

/** 解析后端 serviceCities JSON 字符串为前端结构化数组 */
function parseServiceCities(raw: string | undefined | null): ServiceCityItem[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((it) => it && typeof it === 'object')
      .map((it) => ({
        provinceId: it.provinceId ?? null,
        cityId: it.cityId ?? null,
        provinceName: it.provinceName,
        cityName: it.cityName,
      }));
  } catch {
    return [];
  }
}

// ===== 各角色「修改资料」自动回填 =====

interface AgentFullProfile {
  realName?: string;
  email?: string;
  bio?: string;
  specialties?: string;
  serviceCities?: string;
  agreementVersion?: string;
}

/** 经纪人档案 → AgentFormData */
export async function getMyAgentProfileAsForm(): Promise<Partial<AgentFormData> | null> {
  try {
    const res = await apiGet<ApiResponse<AgentFullProfile>>('/agents/me', {
      headers: authHeaders(),
      silent: true,
    });
    const t = res.data;
    if (!t) return null;
    return {
      realName: t.realName ?? '',
      email: t.email ?? '',
      bio: t.bio ?? '',
      specialties: t.specialties ?? '',
      serviceCities: parseServiceCities(t.serviceCities),
      agreementVersion: t.agreementVersion ?? 'v1',
      agreementSigned: true,
    };
  } catch {
    return null;
  }
}

interface AssistantFullProfile {
  realName?: string;
  email?: string;
  bio?: string;
  authScope?: string;
  serviceCities?: string;
  agreementVersion?: string;
}

/** 助理档案 → AssistantFormData */
export async function getMyAssistantProfileAsForm(): Promise<Partial<AssistantFormData> | null> {
  try {
    const res = await apiGet<ApiResponse<AssistantFullProfile>>('/assistants/me', {
      headers: authHeaders(),
      silent: true,
    });
    const t = res.data;
    if (!t) return null;
    return {
      realName: t.realName ?? '',
      email: t.email ?? '',
      bio: t.bio ?? '',
      authScope: t.authScope ?? '',
      serviceCities: parseServiceCities(t.serviceCities),
      agreementVersion: t.agreementVersion ?? 'v1',
      agreementSigned: true,
    };
  } catch {
    return null;
  }
}

interface EnterpriseAgentFullProfile {
  companyName?: string;
  licenseNo?: string;
  legalPerson?: string;
  industry?: string;
  companySize?: string;
  bio?: string;
  contactName?: string;
  contactPhone?: string;
  provinceId?: number;
  cityId?: number;
  districtId?: number;
  townId?: number;
  address?: string;
  qualificationDocUrl?: string;
  agreementVersion?: string;
}

/** 专家经纪公司档案 → EnterpriseAgentFormData */
export async function getMyEnterpriseAgentProfileAsForm(): Promise<Partial<EnterpriseAgentFormData> | null> {
  try {
    const res = await apiGet<ApiResponse<EnterpriseAgentFullProfile>>('/enterprise-agents/me', {
      headers: authHeaders(),
      silent: true,
    });
    const t = res.data;
    if (!t) return null;
    return {
      companyName: t.companyName ?? '',
      licenseNo: t.licenseNo ?? '',
      legalPerson: t.legalPerson ?? '',
      industry: t.industry ?? '',
      companySize: t.companySize ?? '',
      bio: t.bio ?? '',
      contactName: t.contactName ?? '',
      contactPhone: t.contactPhone ?? '',
      provinceId: t.provinceId ?? null,
      cityId: t.cityId ?? null,
      districtId: t.districtId ?? null,
      townId: t.townId ?? null,
      address: t.address ?? '',
      qualificationDocUrl: t.qualificationDocUrl ?? '',
      agreementVersion: t.agreementVersion ?? 'v1',
      agreementSigned: true,
    };
  } catch {
    return null;
  }
}

interface EnterpriseBuyerFullProfile {
  companyName?: string;
  industry?: string;
  companySize?: string;
  contactName?: string;
  contactPhone?: string;
  provinceId?: number;
  cityId?: number;
  districtId?: number;
  townId?: number;
  address?: string;
  trainingTags?: string;
}

/** 企业培训采购方档案 → EnterpriseBuyerFormData */
export async function getMyEnterpriseBuyerProfileAsForm(): Promise<Partial<EnterpriseBuyerFormData> | null> {
  try {
    const res = await apiGet<ApiResponse<EnterpriseBuyerFullProfile>>('/enterprise-buyers/me', {
      headers: authHeaders(),
      silent: true,
    });
    const t = res.data;
    if (!t) return null;
    return {
      companyName: t.companyName ?? '',
      industry: t.industry ?? '',
      companySize: t.companySize ?? '',
      contactName: t.contactName ?? '',
      contactPhone: t.contactPhone ?? '',
      provinceId: t.provinceId ?? null,
      cityId: t.cityId ?? null,
      districtId: t.districtId ?? null,
      townId: t.townId ?? null,
      address: t.address ?? '',
      trainingTags: t.trainingTags ?? '',
    };
  } catch {
    return null;
  }
}

interface InstitutionFullProfile {
  orgName?: string;
  orgType?: number;
  legalRepresentative?: string;
  licenseNo?: string;
  establishedAt?: string;
  logoUrl?: string;
  bio?: string;
  industries?: string;
  specialties?: string;
  hasVenue?: number;
  hasExperts?: number;
  contactName?: string;
  contactPhone?: string;
  showContact?: number;
  provinceId?: number;
  cityId?: number;
  districtId?: number;
  townId?: number;
  address?: string;
  clientCases?: string;
  agreementVersion?: string;
}

/** 机构档案 → InstitutionFormData */
export async function getMyInstitutionProfileAsForm(): Promise<Partial<InstitutionFormData> | null> {
  try {
    const res = await apiGet<ApiResponse<InstitutionFullProfile>>('/institutions/me', {
      headers: authHeaders(),
      silent: true,
    });
    const t = res.data;
    if (!t) return null;
    // industries / specialties 后端是 JSON 字符串（id 数组），尝试解析为 number[]
    const parseIdList = (raw: string | undefined): number[] => {
      if (!raw) return [];
      try {
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr.filter((x) => typeof x === 'number') : [];
      } catch {
        return [];
      }
    };
    return {
      orgName: t.orgName ?? '',
      orgType: t.orgType ?? 0,
      legalRepresentative: t.legalRepresentative ?? '',
      licenseNo: t.licenseNo ?? '',
      establishedAt: t.establishedAt ?? '',
      logoUrl: t.logoUrl ?? '',
      bio: t.bio ?? '',
      industryCategoryIds: parseIdList(t.industries),
      expertiseCategoryIds: parseIdList(t.specialties),
      clientCases: t.clientCases ?? '',
      hasVenue: t.hasVenue ?? 0,
      hasExperts: t.hasExperts ?? 0,
      contactName: t.contactName ?? '',
      contactPhone: t.contactPhone ?? '',
      showContact: t.showContact ?? 0,
      provinceId: t.provinceId ?? null,
      cityId: t.cityId ?? null,
      districtId: t.districtId ?? null,
      townId: t.townId ?? null,
      address: t.address ?? '',
      agreementVersion: t.agreementVersion ?? 'v1',
      agreementSigned: true,
    };
  } catch {
    return null;
  }
}

interface InstitutionEmployeeFullProfile {
  orgId?: number;
  realName?: string;
  contactPhone?: string;
  email?: string;
  serviceCities?: string;
  agreementVersion?: string;
  position?: string;
  department?: string;
}

/** 机构员工档案 → InstitutionEmployeeFormData */
export async function getMyInstitutionEmployeeProfileAsForm(): Promise<Partial<InstitutionEmployeeFormData> | null> {
  try {
    const res = await apiGet<ApiResponse<InstitutionEmployeeFullProfile>>('/institution-employees/me', {
      headers: authHeaders(),
      silent: true,
    });
    const t = res.data;
    if (!t) return null;
    return {
      realName: t.realName ?? '',
      contactPhone: t.contactPhone ?? '',
      email: t.email ?? '',
      serviceCities: parseServiceCities(t.serviceCities),
      orgId: t.orgId ?? null,
      position: t.position ?? '',
      department: t.department ?? '',
      agreementVersion: t.agreementVersion ?? 'v1',
      agreementSigned: true,
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
