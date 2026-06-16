import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { userKeys } from '../api/queries';
import { getUsersFromServer } from '../api/server-service';
import { UsersTable } from './users-table';

export default async function UserListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('nickname');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');
  const role = searchParamsCache.get('role');
  const regOrigin = searchParamsCache.get('regOrigin');
  const realNameCertStatus = searchParamsCache.get('realNameCertStatus');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(status && { status }),
    ...(role && { role }),
    ...(regOrigin && { regOrigin }),
    ...(realNameCertStatus && { realNameCertStatus })
  };

  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: userKeys.list(filters),
      queryFn: () => getUsersFromServer(filters)
    });
  } catch {
    // 后端未启动、未登录或网络失败时跳过 SSR 数据，由客户端 useSuspenseQuery 重试
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersTable />
    </HydrationBoundary>
  );
}
