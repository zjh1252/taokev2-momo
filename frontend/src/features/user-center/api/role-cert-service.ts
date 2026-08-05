/**
 * 三角色身份信息认证 API 服务
 *
 * <ul>
 *   <li>ENTERPRISE_BUYER — 实名认证 + 工作认证</li>
 *   <li>AGENT — 工作认证（多记录）</li>
 *   <li>ENTERPRISE_AGENT — 资质认证（公司Logo + 营业执照）</li>
 *   <li>INSTITUTION — 公司资料（单条整体审核）</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:00
 */
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import type { ApiResult } from '@/features/user/api/types';
import type { CertStatus, RealNameCert, RealNameCertRequest } from '@/features/user-center/api/cert-service';

function authHeaders(): Record<string, string> {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return { Authorization: `Bearer ${tokenData?.accessToken || ''}` };
}

// ============================ 经纪人 — 工作认证 ============================

/** 经纪人工作认证记录 */
export interface AgentWorkCert {
  id?: number;
  companyName: string;
  position: string;
  startDate: string;
  endDate?: string | null;
  jobDescription?: string;
  proofFile: string;
  status?: 1 | 2 | 3;
  rejectReason?: string | null;
  submittedAt?: string | null;
  auditedAt?: string | null;
  sortOrder?: number;
}

/** 经纪人工作认证提交请求 */
export type AgentWorkCertRequest = Omit<
  AgentWorkCert,
  'id' | 'status' | 'rejectReason' | 'submittedAt' | 'auditedAt'
>;

export function listAgentWorkCerts() {
  return apiGet<ApiResult<AgentWorkCert[]>>('/agents/me/certification/work-experiences', {
    headers: authHeaders(),
  });
}

export function createAgentWorkCert(data: AgentWorkCertRequest) {
  return apiPost<ApiResult<AgentWorkCert>>('/agents/me/certification/work-experiences', data, {
    headers: authHeaders(),
  });
}

export function updateAgentWorkCert(id: number, data: AgentWorkCertRequest) {
  return apiPut<ApiResult<AgentWorkCert>>(
    `/agents/me/certification/work-experiences/${id}`,
    data,
    { headers: authHeaders() },
  );
}

export function deleteAgentWorkCert(id: number) {
  return apiDelete<ApiResult>(`/agents/me/certification/work-experiences/${id}`, {
    headers: authHeaders(),
  });
}

// ============================ 企业采购方 — 实名认证 ============================

export function getBuyerRealNameCert() {
  return apiGet<ApiResult<RealNameCert>>('/enterprise-buyers/me/certification/real-name', {
    headers: authHeaders(),
  });
}

export function submitBuyerRealNameCert(data: RealNameCertRequest) {
  return apiPut<ApiResult>('/enterprise-buyers/me/certification/real-name', data, {
    headers: authHeaders(),
  });
}

// ============================ 企业采购方 — 工作认证 ============================

export type BuyerWorkCert = AgentWorkCert;
export type BuyerWorkCertRequest = AgentWorkCertRequest;

export function listBuyerWorkCerts() {
  return apiGet<ApiResult<BuyerWorkCert[]>>('/enterprise-buyers/me/certification/work-experiences', {
    headers: authHeaders(),
  });
}

export function createBuyerWorkCert(data: BuyerWorkCertRequest) {
  return apiPost<ApiResult<BuyerWorkCert>>('/enterprise-buyers/me/certification/work-experiences', data, {
    headers: authHeaders(),
  });
}

export function updateBuyerWorkCert(id: number, data: BuyerWorkCertRequest) {
  return apiPut<ApiResult<BuyerWorkCert>>(
    `/enterprise-buyers/me/certification/work-experiences/${id}`,
    data,
    { headers: authHeaders() },
  );
}

export function deleteBuyerWorkCert(id: number) {
  return apiDelete<ApiResult>(`/enterprise-buyers/me/certification/work-experiences/${id}`, {
    headers: authHeaders(),
  });
}

// ============================ 经纪公司 — 资质认证 ============================

/** 经纪公司资质认证 — 公司Logo + 营业执照 */
export interface EnterpriseAgentCert {
  certLogoUrl: string | null;
  qualificationDocUrl: string | null;
  status: CertStatus;
  rejectReason: string | null;
  submittedAt: string | null;
  auditedAt: string | null;
}

export interface EnterpriseAgentCertRequest {
  certLogoUrl: string;
  qualificationDocUrl: string;
}

export function getEnterpriseAgentCert() {
  return apiGet<ApiResult<EnterpriseAgentCert>>('/enterprise-agents/me/certification', {
    headers: authHeaders(),
  });
}

export function submitEnterpriseAgentCert(data: EnterpriseAgentCertRequest) {
  return apiPut<ApiResult>('/enterprise-agents/me/certification', data, {
    headers: authHeaders(),
  });
}

// ============================ 培训机构 — 公司资料 ============================

/** 机构公司资料 */
export interface InstitutionCompanyInfo {
  orgName?: string | null;
  logoUrl: string | null;
  companyNature: string | null;
  website: string | null;
  companySize: string | null;
  annualRevenue: string | null;
  registeredCapital: string | null;
  provinceId: number | null;
  cityId: number | null;
  districtId: number | null;
  townId: number | null;
  address: string | null;
  postCode: string | null;
  maxCommissionRate: number | null;
  paymentMethods: string[];
  hasCopyrightCourse: number | null;
  bankCardNo: string | null;
  bankName: string | null;
  bankBranch: string | null;
  licenseDocUrl: string | null;
  licenseNo: string | null;
  status: CertStatus;
  rejectReason: string | null;
  submittedAt: string | null;
  auditedAt: string | null;
}

export interface InstitutionCompanyInfoRequest {
  logoUrl: string;
  companyNature: string;
  website?: string;
  companySize: string;
  annualRevenue: string;
  registeredCapital: string;
  provinceId: number;
  cityId: number;
  districtId: number;
  townId?: number | null;
  address: string;
  postCode?: string;
  maxCommissionRate: number;
  paymentMethods?: string[];
  hasCopyrightCourse?: number;
  bankCardNo?: string;
  bankName?: string;
  bankBranch?: string;
  licenseDocUrl: string;
  licenseNo?: string;
}

export function getInstitutionCompanyInfo() {
  return apiGet<ApiResult<InstitutionCompanyInfo>>('/institutions/me/company-info', {
    headers: authHeaders(),
  });
}

export function submitInstitutionCompanyInfo(data: InstitutionCompanyInfoRequest) {
  return apiPut<ApiResult>('/institutions/me/company-info', data, {
    headers: authHeaders(),
  });
}
