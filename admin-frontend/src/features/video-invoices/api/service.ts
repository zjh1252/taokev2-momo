import { apiClient } from '@/lib/api-client';
import type { VideoInvoiceFilters, VideoInvoicesResponse } from './types';

export function buildVideoInvoiceParams(
  filters: VideoInvoiceFilters
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('size', String(filters.limit));
  if (filters.orderNo) params.set('orderNo', filters.orderNo);
  if (filters.videoName) params.set('videoName', filters.videoName);
  if (filters.status) params.set('status', filters.status);
  if (filters.invoiceType) params.set('invoiceType', filters.invoiceType);
  if (filters.titleType) params.set('titleType', filters.titleType);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.user) params.set('user', filters.user);
  return params;
}

export async function getVideoInvoices(
  filters: VideoInvoiceFilters
): Promise<VideoInvoicesResponse> {
  const params = buildVideoInvoiceParams(filters);
  return apiClient<VideoInvoicesResponse>(
    `/video-invoices?${params.toString()}`
  );
}

export async function issueVideoInvoice(id: number) {
  return apiClient<{ code: number; message: string }>(
    `/video-invoices/${id}/issue`,
    { method: 'PUT' }
  );
}

export async function rejectVideoInvoice(id: number, reason?: string) {
  return apiClient<{ code: number; message: string }>(
    `/video-invoices/${id}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason: reason ?? '' }) }
  );
}

export async function batchIssueVideoInvoices(ids: number[]) {
  return apiClient<{ code: number; message: string }>(
    '/video-invoices/batch-issue',
    { method: 'POST', body: JSON.stringify({ ids }) }
  );
}

export async function batchRejectVideoInvoices(ids: number[]) {
  return apiClient<{ code: number; message: string }>(
    '/video-invoices/batch-reject',
    { method: 'POST', body: JSON.stringify({ ids }) }
  );
}
