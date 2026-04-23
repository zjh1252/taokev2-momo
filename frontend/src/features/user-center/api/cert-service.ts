/**
 * 专家四维度资质认证（实名 / 专业 / 学历 / 工作）API 服务。
 *
 * <p>对应后端 {@code /trainers/me/certification/...} 端点。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-16 17:00
 */
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import type { ApiResult } from '@/features/user/api/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

function authHeaders(): Record<string, string> {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return { Authorization: `Bearer ${tokenData?.accessToken || ''}` };
}

// ===================== 类型 =====================

/** 认证状态：null=未提交 / 1=待审核 / 2=已通过 / 3=已驳回 */
export type CertStatus = 1 | 2 | 3 | null;

/** 实名认证查询返回 */
export interface RealNameCert {
  realName: string | null;
  idCardNo: string | null;
  idCardFront: string | null;
  idCardBack: string | null;
  status: CertStatus;
  rejectReason: string | null;
  submittedAt: string | null;
  auditedAt: string | null;
}

/** 实名认证提交请求 */
export interface RealNameCertRequest {
  realName: string;
  idCardNo: string;
  idCardFront: string;
  idCardBack: string;
}

/** 专业认证查询返回 */
export interface ProfessionalCert {
  files: string[];
  status: CertStatus;
  rejectReason: string | null;
  submittedAt: string | null;
  auditedAt: string | null;
}

/** 专业认证提交请求 */
export interface ProfessionalCertRequest {
  files: string[];
}

/** 学历认证记录（DTO，复用查询/编辑） */
export interface EducationCert {
  id?: number;
  holderName: string;
  schoolName: string;
  major: string;
  degree?: string;
  startDate: string;
  endDate?: string | null;
  isGraduated?: number;
  proofFile: string;
  status?: 1 | 2 | 3;
  rejectReason?: string | null;
  auditedAt?: string | null;
  sortOrder?: number;
}

/** 学历认证提交请求 */
export type EducationCertRequest = Omit<EducationCert, 'id' | 'status' | 'rejectReason' | 'auditedAt'>;

/** 工作认证记录 */
export interface WorkCert {
  id?: number;
  companyName: string;
  position: string;
  startDate: string;
  endDate?: string | null;
  jobDescription?: string;
  proofFile: string;
  status?: 1 | 2 | 3;
  rejectReason?: string | null;
  auditedAt?: string | null;
  sortOrder?: number;
}

/** 工作认证提交请求 */
export type WorkCertRequest = Omit<WorkCert, 'id' | 'status' | 'rejectReason' | 'auditedAt'>;

// ===================== 实名 / 专业 =====================

export function getRealNameCert() {
  return apiGet<ApiResult<RealNameCert>>('/trainers/me/certification/real-name', {
    headers: authHeaders(),
  });
}

export function submitRealNameCert(data: RealNameCertRequest) {
  return apiPut<ApiResult>('/trainers/me/certification/real-name', data, {
    headers: authHeaders(),
  });
}

export function getProfessionalCert() {
  return apiGet<ApiResult<ProfessionalCert>>('/trainers/me/certification/professional', {
    headers: authHeaders(),
  });
}

export function submitProfessionalCert(data: ProfessionalCertRequest) {
  return apiPut<ApiResult>('/trainers/me/certification/professional', data, {
    headers: authHeaders(),
  });
}

// ===================== 学历 =====================

export function listEducationCerts() {
  return apiGet<ApiResult<EducationCert[]>>('/trainers/me/certification/educations', {
    headers: authHeaders(),
  });
}

export function createEducationCert(data: EducationCertRequest) {
  return apiPost<ApiResult<EducationCert>>('/trainers/me/certification/educations', data, {
    headers: authHeaders(),
  });
}

export function updateEducationCert(id: number, data: EducationCertRequest) {
  return apiPut<ApiResult<EducationCert>>(`/trainers/me/certification/educations/${id}`, data, {
    headers: authHeaders(),
  });
}

export function deleteEducationCert(id: number) {
  return apiDelete<ApiResult>(`/trainers/me/certification/educations/${id}`, {
    headers: authHeaders(),
  });
}

// ===================== 工作 =====================

export function listWorkCerts() {
  return apiGet<ApiResult<WorkCert[]>>('/trainers/me/certification/work-experiences', {
    headers: authHeaders(),
  });
}

export function createWorkCert(data: WorkCertRequest) {
  return apiPost<ApiResult<WorkCert>>('/trainers/me/certification/work-experiences', data, {
    headers: authHeaders(),
  });
}

export function updateWorkCert(id: number, data: WorkCertRequest) {
  return apiPut<ApiResult<WorkCert>>(`/trainers/me/certification/work-experiences/${id}`, data, {
    headers: authHeaders(),
  });
}

export function deleteWorkCert(id: number) {
  return apiDelete<ApiResult>(`/trainers/me/certification/work-experiences/${id}`, {
    headers: authHeaders(),
  });
}

// ===================== 通用文件上传（PDF / Word / 图片均可） =====================

/**
 * 上传认证用证明文件 — 自动按 MIME 类型分流到 /uploads/files 或 /uploads/images。
 */
export async function uploadCertFile(file: File): Promise<string> {
  const isImage = file.type.startsWith('image/');
  const endpoint = isImage ? '/uploads/images' : '/uploads/files';
  const formData = new FormData();
  formData.append('file', file);
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  const resp = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenData?.accessToken || ''}` },
    body: formData,
  });
  if (!resp.ok) throw new Error('上传失败');
  const json = (await resp.json()) as { data: { url: string } };
  return json.data.url;
}
