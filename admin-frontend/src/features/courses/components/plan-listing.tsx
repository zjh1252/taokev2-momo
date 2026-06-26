import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { courseKeys } from '../api/queries';
import { getPlansFromServer } from '../api/server-service';
import { PlansTable } from './plans-table';

export default async function PlanListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search })
  };

  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: courseKeys.plans(filters),
      queryFn: () => getPlansFromServer(filters)
    });
  } catch {
    // 后端未启动、未登录或网络失败时跳过 SSR 数据，由客户端 useSuspenseQuery 重试
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PlansTable />
    </HydrationBoundary>
  );
}
