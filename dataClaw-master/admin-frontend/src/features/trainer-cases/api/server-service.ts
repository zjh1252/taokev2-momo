import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import type {
  TrainerCaseFilters,
  TrainerCasesResponse
} from './types';
import { buildCaseParams } from './service';

/** 服务端预取：案例列表 */
export async function getTrainerCasesFromServer(
  filters: TrainerCaseFilters
): Promise<TrainerCasesResponse> {
  const params = buildCaseParams(filters);
  return serverFetch(
    `/admin/trainer-cases?${params.toString()}`
  ) as Promise<TrainerCasesResponse>;
}
