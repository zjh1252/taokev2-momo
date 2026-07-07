import http from '@/utils/request';

export const HighlightStatus = { PENDING: 0, APPROVED: 1, REJECTED: 2 };

export const HighlightStatusLabel = {
  0: '待审核',
  1: '已通过',
  2: '已驳回',
};

export const MediaType = { IMAGE: 1, VIDEO: 2 };

function qs(trainerUserId) {
  return trainerUserId ? { trainerUserId } : {};
}

export const getMyHighlights = (trainerUserId) =>
  http.get('/trainers/me/highlights', qs(trainerUserId));

export const createHighlight = (data, trainerUserId) =>
  http.post('/trainers/me/highlights', data, qs(trainerUserId));

export const updateHighlight = (id, data, trainerUserId) =>
  http.put(`/trainers/me/highlights/${id}`, data, qs(trainerUserId));

export const deleteHighlight = (id, trainerUserId) =>
  http.del(`/trainers/me/highlights/${id}`, qs(trainerUserId));

export const addHighlightFile = (highlightId, data, trainerUserId) =>
  http.post(`/trainers/me/highlights/${highlightId}/files`, data, qs(trainerUserId));

export const deleteHighlightFile = (highlightId, fileId, trainerUserId) =>
  http.del(`/trainers/me/highlights/${highlightId}/files/${fileId}`, qs(trainerUserId));
