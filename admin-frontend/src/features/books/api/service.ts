import { apiClient } from '@/lib/api-client';
import type {
  AdminBook,
  BookDetailResponse,
  BookFilters,
  BooksResponse,
  CreateBookPayload
} from './types';

export function buildBookParams(filters: BookFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('keyword', filters.search);
  if (filters.status) params.set('status', filters.status);
  return params;
}

export async function getBooks(filters: BookFilters): Promise<BooksResponse> {
  return apiClient<BooksResponse>(`/books?${buildBookParams(filters).toString()}`);
}

export async function getBookDetail(id: number): Promise<BookDetailResponse> {
  return apiClient<BookDetailResponse>(`/books/${id}`);
}

export async function approveBook(id: number) {
  return apiClient<{ code: number; message: string }>(`/books/${id}/approve`, {
    method: 'PUT'
  });
}

export async function createBook(payload: CreateBookPayload) {
  const { trainerId, ...body } = payload;
  return apiClient<{ code: number; message: string; data: AdminBook }>(
    `/books?trainerId=${trainerId}`,
    {
      method: 'POST',
      body: JSON.stringify(body)
    }
  );
}

export async function rejectBook(id: number, reason: string) {
  return apiClient<{ code: number; message: string }>(`/books/${id}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ reason })
  });
}
