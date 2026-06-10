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
export default async function AgentCertListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');

  const filters = {
    page,
    limit: pageLimit,
    ...(status && { status })
  };

  const queryClient = getQueryClient();
  try {
    await queryClient.prefetchQuery({
      queryKey: agentCertKeys.work(filters),
      queryFn: () => getAgentWorkCertsFromServer(filters)
    });
  } catch {
    // 后端未启动、未登录或网络失败时跳过 SSR 数据，由客户端 useSuspenseQuery 重试
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AgentWorkCertTable />
    </HydrationBoundary>
  );
}
