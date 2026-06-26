import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import type { UserFilters, UsersResponse } from './types';
import { buildUserParams } from './service';

/** 服务端预取：直接调后端，绕过 BFF */
export async function getUsersFromServer(
  filters: UserFilters
): Promise<UsersResponse> {
  const params = buildUserParams(filters);
  return serverFetch(`/admin/users?${params.toString()}`) as Promise<UsersResponse>;
}
