import { apiClient, assertApiOk } from '@/lib/api-client';
import type {
  BatchMaterialPayload,
  MaterialFilters,
  MaterialResponse,
  MaterialsResponse,
  SaveMaterialPayload,
  UpdateMaterialPayload,
  UploadMaterialPayload
} from './types';

export function buildMaterialParams(filters: MaterialFilters): URLSearchParams {
  const params = new URLSearchParams();
  params.set('materialType', filters.materialType);
  params.set('page', String(filters.page ?? 1));
  params.set('size', String(filters.limit ?? 20));
  if (filters.keyword) params.set('keyword', filters.keyword);
  if (filters.category) params.set('category', filters.category);
  if (filters.scene) params.set('scene', filters.scene);
  if (filters.enabled) params.set('enabled', filters.enabled);
  if (filters.isDefault) params.set('isDefault', filters.isDefault);
  return params;
}

export async function getMaterials(
  filters: MaterialFilters
): Promise<MaterialsResponse> {
  const params = buildMaterialParams(filters);
  return apiClient<MaterialsResponse>(`/materials?${params.toString()}`);
}

export async function createMaterial(payload: SaveMaterialPayload) {
  const resp = await apiClient<MaterialResponse>('/materials', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  assertApiOk(resp);
  return resp;
}

export async function updateMaterial(id: number, payload: UpdateMaterialPayload) {
  const resp = await apiClient<MaterialResponse>(`/materials/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  assertApiOk(resp);
  return resp;
}

export async function deleteMaterial(id: number) {
  return apiClient<{ code: number; message: string }>(`/materials/${id}`, {
    method: 'DELETE'
  });
}

export async function setMaterialEnabled(id: number, enabled: boolean) {
  return apiClient<{ code: number; message: string }>(`/materials/${id}/enabled`, {
    method: 'PUT',
    body: JSON.stringify({ enabled })
  });
}

export async function setMaterialDefault(id: number, isDefault: boolean) {
  return apiClient<{ code: number; message: string }>(`/materials/${id}/default`, {
    method: 'PUT',
    body: JSON.stringify({ isDefault })
  });
}

export async function batchOperateMaterials(payload: BatchMaterialPayload) {
  const resp = await apiClient<{ code: number; message: string }>(
    '/materials/batch',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  );
  assertApiOk({ ...resp, data: null });
  return resp;
}

export async function uploadImageFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/uploads/images', {
    method: 'POST',
    body: formData
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || '上传失败');
  }
  return (body.data as { url: string }).url;
}

export async function uploadMaterials(
  payloads: UploadMaterialPayload[]
): Promise<MaterialResponse[]> {
  const results: MaterialResponse[] = [];
  for (const payload of payloads) {
    results.push(await uploadMaterial(payload));
  }
  return results;
}

export async function uploadMaterial(
  payload: UploadMaterialPayload
): Promise<MaterialResponse> {
  const formData = new FormData();
  formData.append('file', payload.file);
  formData.append('materialType', payload.materialType);
  if (payload.name) formData.append('name', payload.name);
  if (payload.category) formData.append('category', payload.category);
  if (payload.scene) formData.append('scene', payload.scene);
  if (payload.enabled !== undefined) {
    formData.append('enabled', String(payload.enabled));
  }
  if (payload.isDefault !== undefined) {
    formData.append('isDefault', String(payload.isDefault));
  }

  const res = await fetch('/api/materials/upload', {
    method: 'POST',
    body: formData
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || '上传失败');
  }
  return body as MaterialResponse;
}
