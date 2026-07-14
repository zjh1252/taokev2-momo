import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { alliancePartnerKeys } from '../api/queries';
import { getAlliancePartnerApplicationsFromServer } from '../api/server-service';
import { AlliancePartnerApplicationsTable } from './applications-table';

export default async function AlliancePartnerApplicationListing() {
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
      queryKey: alliancePartnerKeys.applications(filters),
      queryFn: () => getAlliancePartnerApplicationsFromServer(filters)
    });
  } catch {
    // 后端未启动、未登录或网络失败时跳过 SSR 数据，由客户端重试
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AlliancePartnerApplicationsTable />
    </HydrationBoundary>
  );
}
