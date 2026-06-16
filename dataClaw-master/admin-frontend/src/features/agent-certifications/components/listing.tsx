import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { agentCertKeys } from '../api/queries';
import { getAgentWorkCertsFromServer } from '../api/server-service';
import { AgentWorkCertTable } from './work-table';

/**
 * 经纪人资质认证审核列表（目前仅工作认证）。
 *
 * @author Fangxinxin
 * @date 2026-04-16 21:30
 */
export default function AgentCertListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');

  const filters = {
    page,
    limit: pageLimit,
    ...(status && { status })
  };

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery({
    queryKey: agentCertKeys.work(filters),
    queryFn: () => getAgentWorkCertsFromServer(filters)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AgentWorkCertTable />
    </HydrationBoundary>
  );
}
