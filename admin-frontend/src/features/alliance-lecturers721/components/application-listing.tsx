import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { allianceLecturer721Keys } from '../api/queries';
import { getAllianceLecturer721ApplicationsFromServer } from '../api/server-service';
import { AllianceLecturer721ApplicationsTable } from './applications-table';

export default async function AllianceLecturer721ApplicationListing() {
  const page = searchParamsCache.get('page');
  const size = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');
  const filters = {
    page,
    size,
    ...(status && { status })
  };
  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: allianceLecturer721Keys.applications(filters),
      queryFn: () => getAllianceLecturer721ApplicationsFromServer(filters)
    });
  } catch {
    // 后端未启动、未登录或网络失败时跳过 SSR 数据，由客户端重试
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AllianceLecturer721ApplicationsTable />
    </HydrationBoundary>
  );
}
