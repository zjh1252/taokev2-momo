import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import type {
  TrainerMessageFilters,
  TrainerMessagesResponse,
  TrainerMessageDetailResponse,
} from './types';
import { buildMessageParams } from './service';

/** 服务端预取：留言列表 */
export async function getTrainerMessagesFromServer(
  filters: TrainerMessageFilters,
): Promise<TrainerMessagesResponse> {
  const params = buildMessageParams(filters);
  return serverFetch(
    `/admin/trainer-messages?${params.toString()}`,
  ) as Promise<TrainerMessagesResponse>;
}

/** 服务端预取：留言详情 */
export async function getTrainerMessageDetailFromServer(
  id: number,
): Promise<TrainerMessageDetailResponse> {
  return serverFetch(
    `/admin/trainer-messages/${id}`,
  ) as Promise<TrainerMessageDetailResponse>;
}
