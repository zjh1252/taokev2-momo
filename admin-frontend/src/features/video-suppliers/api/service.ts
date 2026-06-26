import { apiClient } from '@/lib/api-client';
import type {
  VideoSupplierFilters,
  VideoSuppliersResponse,
  UpdateVideoSupplierPayload,
  SupplierCategoryNode,
  SaveSupplierCategoryPayload,
  SupplierVideosResponse
} from './types';

type ApiResp<T> = { code: number; message: string; data: T };

export function buildSupplierParams(filters: VideoSupplierFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('size', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  return params;
}

export async function getVideoSuppliers(
  filters: VideoSupplierFilters
): Promise<VideoSuppliersResponse> {
  const params = buildSupplierParams(filters);
  return apiClient<VideoSuppliersResponse>(
    `/video-suppliers?${params.toString()}`
  );
}

export async function updateVideoSupplier(
  id: number,
  payload: UpdateVideoSupplierPayload
) {
  return apiClient<ApiResp<null>>(`/video-suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function getSupplierCategories(supplierId: number) {
  return apiClient<ApiResp<SupplierCategoryNode[]>>(
    `/video-suppliers/${supplierId}/categories`
  );
}

export async function createSupplierCategory(
  supplierId: number,
  payload: SaveSupplierCategoryPayload
) {
  return apiClient<ApiResp<SupplierCategoryNode>>(
    `/video-suppliers/${supplierId}/categories`,
    { method: 'POST', body: JSON.stringify(payload) }
  );
}

export async function updateSupplierCategory(
  supplierId: number,
  categoryId: number,
  payload: SaveSupplierCategoryPayload
) {
  return apiClient<ApiResp<SupplierCategoryNode>>(
    `/video-suppliers/${supplierId}/categories/${categoryId}`,
    { method: 'PUT', body: JSON.stringify(payload) }
  );
}

export async function deleteSupplierCategory(
  supplierId: number,
  categoryId: number
) {
  return apiClient<ApiResp<null>>(
    `/video-suppliers/${supplierId}/categories/${categoryId}`,
    { method: 'DELETE' }
  );
}

export async function getSupplierVideos(
  supplierId: number,
  page = 1,
  size = 20
): Promise<SupplierVideosResponse> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size)
  });
  return apiClient<SupplierVideosResponse>(
    `/video-suppliers/${supplierId}/videos?${params.toString()}`
  );
}

export async function updateSupplierVideoSort(
  supplierId: number,
  videoId: number,
  sortOrder: number
) {
  return apiClient<ApiResp<null>>(
    `/video-suppliers/${supplierId}/videos/${videoId}/sort-order`,
    { method: 'PUT', body: JSON.stringify({ sortOrder }) }
  );
}
