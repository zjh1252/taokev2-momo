import { apiClient } from '@/lib/api-client';
import type {
  CertFilters,
  CertPageResponse,
  AdminRealNameCert,
  AdminProfessionalCert,
  AdminEducationCert,
  AdminWorkCert
} from './types';

/**
 * 后台 — 专家资质认证审核 API（客户端版本）。
 *
 * @author Fangxinxin
 * @date 2026-04-16 20:00
 */

export function buildCertParams(filters: CertFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('size', String(filters.limit));
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  return params;
}

// =========== 实名 ===========

export function getRealNameCerts(filters: CertFilters) {
  const params = buildCertParams(filters);
  return apiClient<CertPageResponse<AdminRealNameCert>>(
    `/admin/trainers/certifications/real-name?${params.toString()}`
  );
}

export function approveRealName(trainerId: number) {
  return apiClient<{ code: number; message: string }>(
    `/admin/trainers/certifications/real-name/${trainerId}/approve`,
    { method: 'PUT' }
  );
}

export function rejectRealName(trainerId: number, reason: string) {
  return apiClient<{ code: number; message: string }>(
    `/admin/trainers/certifications/real-name/${trainerId}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason }) }
  );
}

// =========== 专业 ===========

export function getProfessionalCerts(filters: CertFilters) {
  const params = buildCertParams(filters);
  return apiClient<CertPageResponse<AdminProfessionalCert>>(
    `/admin/trainers/certifications/professional?${params.toString()}`
  );
}

export function approveProfessional(trainerId: number) {
  return apiClient<{ code: number; message: string }>(
    `/admin/trainers/certifications/professional/${trainerId}/approve`,
    { method: 'PUT' }
  );
}

export function rejectProfessional(trainerId: number, reason: string) {
  return apiClient<{ code: number; message: string }>(
    `/admin/trainers/certifications/professional/${trainerId}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason }) }
  );
}

// =========== 学历 ===========

export function getEducationCerts(filters: CertFilters) {
  const params = buildCertParams(filters);
  return apiClient<CertPageResponse<AdminEducationCert>>(
    `/admin/trainers/certifications/educations?${params.toString()}`
  );
}

export function approveEducation(id: number) {
  return apiClient<{ code: number; message: string }>(
    `/admin/trainers/certifications/educations/${id}/approve`,
    { method: 'PUT' }
  );
}

export function rejectEducation(id: number, reason: string) {
  return apiClient<{ code: number; message: string }>(
    `/admin/trainers/certifications/educations/${id}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason }) }
  );
}

// =========== 工作 ===========

export function getWorkCerts(filters: CertFilters) {
  const params = buildCertParams(filters);
  return apiClient<CertPageResponse<AdminWorkCert>>(
    `/admin/trainers/certifications/work-experiences?${params.toString()}`
  );
}

export function approveWork(id: number) {
  return apiClient<{ code: number; message: string }>(
    `/admin/trainers/certifications/work-experiences/${id}/approve`,
    { method: 'PUT' }
  );
}

export function rejectWork(id: number, reason: string) {
  return apiClient<{ code: number; message: string }>(
    `/admin/trainers/certifications/work-experiences/${id}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason }) }
  );
}
