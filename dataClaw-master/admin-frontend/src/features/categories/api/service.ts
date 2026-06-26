import { apiClient } from '@/lib/api-client';
import type { CategoryNode, SaveCategoryPayload, UpdateCategoryPayload } from './types';

type ApiResp<T> = { code: number; message: string; data: T };

export async function getCategoryTree(type: string) {
  return apiClient<ApiResp<CategoryNode[]>>(`/categories/tree?type=${type}`);
}

export async function createCategory(payload: SaveCategoryPayload) {
  return apiClient<ApiResp<CategoryNode>>('/categories', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateCategory(id: number, payload: UpdateCategoryPayload) {
  return apiClient<ApiResp<CategoryNode>>(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deleteCategory(id: number) {
  return apiClient<ApiResp<null>>(`/categories/${id}`, {
    method: 'DELETE'
  });
}
