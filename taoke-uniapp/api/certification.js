/**
 * 专家四维度资质认证 API — 对齐 frontend cert-service.ts
 */
import http from '@/utils/request';

// ===================== 实名 / 专业 =====================

export const getRealNameCert = () => http.get('/trainers/me/certification/real-name');

export const submitRealNameCert = (data) =>
  http.put('/trainers/me/certification/real-name', data);

export const getProfessionalCert = () => http.get('/trainers/me/certification/professional');

export const submitProfessionalCert = (data) =>
  http.put('/trainers/me/certification/professional', data);

// ===================== 学历 =====================

export const listEducationCerts = () => http.get('/trainers/me/certification/educations');

export const createEducationCert = (data) =>
  http.post('/trainers/me/certification/educations', data);

export const updateEducationCert = (id, data) =>
  http.put(`/trainers/me/certification/educations/${id}`, data);

export const deleteEducationCert = (id) =>
  http.del(`/trainers/me/certification/educations/${id}`);

// ===================== 工作 =====================

export const listWorkCerts = () => http.get('/trainers/me/certification/work-experiences');

export const createWorkCert = (data) =>
  http.post('/trainers/me/certification/work-experiences', data);

export const updateWorkCert = (id, data) =>
  http.put(`/trainers/me/certification/work-experiences/${id}`, data);

export const deleteWorkCert = (id) =>
  http.del(`/trainers/me/certification/work-experiences/${id}`);
