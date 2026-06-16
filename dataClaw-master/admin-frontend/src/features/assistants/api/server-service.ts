import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import type {
  AssistantFilters,
  AssistantsResponse
} from './types';
import { buildAssistantParams } from './service';

export async function getAssistantsFromServer(
  filters: AssistantFilters
): Promise<AssistantsResponse> {
  return serverFetch(
    `/admin/assistants?${buildAssistantParams(filters).toString()}`
  ) as Promise<AssistantsResponse>;
}
