import { apiClient } from '@/lib/api-client';
import type { VideoCommentFilters, VideoCommentsResponse } from './types';

export function buildVideoCommentParams(
  filters: VideoCommentFilters
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('size', String(filters.limit));
  if (filters.videoTitle) params.set('videoTitle', filters.videoTitle);
  if (filters.auditStatus) params.set('auditStatus', filters.auditStatus);
  if (filters.commentUser) params.set('commentUser', filters.commentUser);
  if (filters.publisher) params.set('publisher', filters.publisher);
  return params;
}

export async function getVideoComments(
  filters: VideoCommentFilters
): Promise<VideoCommentsResponse> {
  const params = buildVideoCommentParams(filters);
  return apiClient<VideoCommentsResponse>(
    `/video-comments?${params.toString()}`
  );
}

export async function approveVideoComment(id: number) {
  return apiClient<{ code: number; message: string }>(
    `/video-comments/${id}/approve`,
    { method: 'PUT' }
  );
}

export async function rejectVideoComment(id: number, reason?: string) {
  return apiClient<{ code: number; message: string }>(
    `/video-comments/${id}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason: reason ?? '' }) }
  );
}

export async function deleteVideoComment(id: number) {
  return apiClient<{ code: number; message: string }>(
    `/video-comments/${id}`,
    { method: 'DELETE' }
  );
}

export async function batchApproveVideoComments(ids: number[]) {
  return apiClient<{ code: number; message: string }>(
    '/video-comments/batch-approve',
    { method: 'POST', body: JSON.stringify({ ids }) }
  );
}

export async function batchRejectVideoComments(ids: number[]) {
  return apiClient<{ code: number; message: string }>(
    '/video-comments/batch-reject',
    { method: 'POST', body: JSON.stringify({ ids }) }
  );
}

export async function batchDeleteVideoComments(ids: number[]) {
  return apiClient<{ code: number; message: string }>(
    '/video-comments/batch-delete',
    { method: 'POST', body: JSON.stringify({ ids }) }
  );
}
