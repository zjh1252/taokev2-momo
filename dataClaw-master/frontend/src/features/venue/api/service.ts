import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';

interface ApiResponse<T> {
  code: string;
  message?: string;
  data: T;
}

function authHeaders(): Record<string, string> {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return { Authorization: `Bearer ${tokenData?.accessToken || ''}` };
}

export interface VenueItem {
  id: number;
  institutionId: number;
  name: string;
  provinceId?: number;
  provinceName?: string;
  cityId?: number;
  cityName?: string;
  districtId?: number;
  districtName?: string;
  address?: string;
  capacity?: number;
  coverUrl?: string;
  /** 场地多图列表 */
  images?: string[];
  description?: string;
  status: number;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface VenuePayload {
  name: string;
  provinceId?: number;
  cityId?: number;
  districtId?: number;
  address?: string;
  capacity?: number;
  coverUrl?: string;
  /** 场地多图（最多 9 张） */
  images?: string[];
  description?: string;
  status?: number;
  sortOrder?: number;
}

export async function listMyVenues(): Promise<VenueItem[]> {
  const res = await apiGet<ApiResponse<VenueItem[]>>(`/institutions/me/venues`, {
    headers: authHeaders(),
  });
  return res.data || [];
}

export async function createVenue(payload: VenuePayload): Promise<VenueItem> {
  const res = await apiPost<ApiResponse<VenueItem>>(`/institutions/me/venues`, payload, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function updateVenue(id: number, payload: VenuePayload): Promise<VenueItem> {
  const res = await apiPut<ApiResponse<VenueItem>>(`/institutions/me/venues/${id}`, payload, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function toggleVenueStatus(id: number): Promise<void> {
  await apiPut<ApiResponse<null>>(`/institutions/me/venues/${id}/toggle-status`, undefined, {
    headers: authHeaders(),
  });
}

export async function deleteVenue(id: number): Promise<void> {
  await apiDelete<ApiResponse<null>>(`/institutions/me/venues/${id}`, {
    headers: authHeaders(),
  });
}
