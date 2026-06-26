import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import type { SensitiveWordFilters, SensitiveWordsResponse } from './types';
import { buildSensitiveWordParams } from './service';

/** 服务端预取：敏感词列表 */
export async function getSensitiveWordsFromServer(
  filters: SensitiveWordFilters
): Promise<SensitiveWordsResponse> {
  const params = buildSensitiveWordParams(filters);
  return serverFetch(
    `/admin/sensitive-words?${params.toString()}`
  ) as Promise<SensitiveWordsResponse>;
}
