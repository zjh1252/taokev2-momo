import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { allianceAmbassadorKeys } from '../api/queries';
import { getAllianceAmbassadorApplicationsFromServer } from '../api/server-service';
import { AllianceAmbassadorApplicationsTable } from './applications-table';

export default async function AllianceAmbassadorApplicationListing() {
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
      queryKey: allianceAmbassadorKeys.applications(filters),
      queryFn: () => getAllianceAmbassadorApplicationsFromServer(filters)
    });
  } catch {
    // 后端未启动、未登录或网络失败时跳过 SSR 数据，由客户端重试
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AllianceAmbassadorApplicationsTable />
    </HydrationBoundary>
  );
}
