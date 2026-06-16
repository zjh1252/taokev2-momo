import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import type { TrainerFilters, TrainersResponse, ApplicationsResponse } from './types';
import { buildTrainerParams } from './service';

/** 服务端预取：专家列表 */
export async function getTrainersFromServer(
  filters: TrainerFilters
): Promise<TrainersResponse> {
  const params = buildTrainerParams(filters);
  return serverFetch(`/admin/trainers?${params.toString()}`) as Promise<TrainersResponse>;
}

/** 服务端预取：专家申请列表 */
export async function getApplicationsFromServer(
  filters: TrainerFilters
): Promise<ApplicationsResponse> {
  const params = buildTrainerParams(filters);
  return serverFetch(
    `/admin/trainers/applications?${params.toString()}`
  ) as Promise<ApplicationsResponse>;
}
