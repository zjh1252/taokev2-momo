import { apiClient } from '@/lib/api-client';
import type {
  TrainerFilters,
  TrainersResponse,
  ApplicationsResponse
} from './types';

export function buildTrainerParams(filters: TrainerFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  return params;
}

export async function getTrainerDetail(id: number) {
  return apiClient<import('./types').TrainerDetailResponse>(`/trainers/${id}`);
}

/** 客户端：专家列表 */
export async function getTrainers(
  filters: TrainerFilters
): Promise<TrainersResponse> {
  const params = buildTrainerParams(filters);
  return apiClient<TrainersResponse>(`/trainers?${params.toString()}`);
}

/** 客户端：专家申请列表 */
export async function getApplications(
  filters: TrainerFilters
): Promise<ApplicationsResponse> {
  const params = buildTrainerParams(filters);
  return apiClient<ApplicationsResponse>(
    `/trainers/applications?${params.toString()}`
  );
}

/** 审核通过 */
export async function approveApplication(userId: number) {
  return apiClient<{ code: number; message: string }>(
    `/trainers/applications/${userId}/approve`,
    { method: 'PUT' }
  );
}

/** 驳回申请 */
export async function rejectApplication(
  userId: number,
  reason: string
) {
  return apiClient<{ code: number; message: string }>(
    `/trainers/applications/${userId}/reject`,
    { method: 'PUT', body: JSON.stringify({ reason }) }
  );
}

/** 切换专家推荐位 */
export async function setTrainerRecommended(
  trainerId: number,
  value: 0 | 1
) {
  return apiClient<{ code: number; message: string }>(
    `/trainers/${trainerId}/recommend?value=${value}`,
    { method: 'PATCH' }
  );
}

/** 获取专家申请详情 */
export async function getTrainerApplicationDetail(userId: number) {
  return apiClient<{ code: number; message: string; data: import('./types').AdminApplicationDetail }>(
    `/trainers/applications/${userId}/detail`
  );
}

/** 运营编辑专家档案 */
export async function updateTrainerDetail(
  trainerId: number,
  payload: import('./detail-types').AdminTrainerUpdatePayload
) {
  return apiClient<import('./types').TrainerDetailResponse>(
    `/trainers/${trainerId}`,
    { method: 'PUT', body: JSON.stringify(payload) }
  );
}

export type CreateTrainerApplicationPayload = {
  userId?: number;
  phone?: string;
  nickname?: string;
  autoApprove?: boolean;
  profile: {
    name: string;
    teachingName: string;
    avatar: string;
    gender: number;
    phone: string;
    email: string;
    idCardNo: string;
    provinceId: number;
    cityId: number;
    districtId?: number;
    townId?: number;
    address?: string;
    oneLineIntro: string;
    bio: string;
    industryCategoryIds: number[];
    expertiseCategoryIds: number[];
    taokePrice: number;
    taokeCommission: number;
    agreementSigned: boolean;
    agreementVersion?: string;
    title?: string;
    background?: string;
    partialClients?: string;
  };
};

/** 运营代填专家入驻申请 */
export async function createTrainerApplication(payload: CreateTrainerApplicationPayload) {
  return apiClient<{ code: number; message: string; data: { trainerId?: number; userId: number } }>(
    '/trainers/applications',
    { method: 'POST', body: JSON.stringify(payload) }
  );
}
