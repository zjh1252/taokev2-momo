import http from '@/utils/request';

export const CaseStatus = { PENDING: 0, APPROVED: 1, REJECTED: 2 };

export const CaseStatusLabel = {
  0: '待审核',
  1: '已通过',
  2: '已驳回',
};

function qs(trainerUserId) {
  return trainerUserId ? { trainerUserId } : {};
}

export const getMyCases = (trainerUserId) =>
  http.get('/trainers/me/cases', qs(trainerUserId));

export const getMyCaseDetail = (id, trainerUserId) =>
  http.get(`/trainers/me/cases/${id}`, qs(trainerUserId));

export const createCase = (data, trainerUserId) =>
  http.post('/trainers/me/cases', data, qs(trainerUserId));

export const updateCase = (id, data, trainerUserId) =>
  http.put(`/trainers/me/cases/${id}`, data, qs(trainerUserId));

export const deleteCase = (id, trainerUserId) =>
  http.del(`/trainers/me/cases/${id}`, qs(trainerUserId));

export const addCaseFile = (caseId, data, trainerUserId) =>
  http.post(`/trainers/me/cases/${caseId}/files`, data, qs(trainerUserId));

export const deleteCaseFile = (caseId, fileId, trainerUserId) =>
  http.del(`/trainers/me/cases/${caseId}/files/${fileId}`, qs(trainerUserId));
