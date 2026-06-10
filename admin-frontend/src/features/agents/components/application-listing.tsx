import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { agentKeys } from '../api/queries';
import { getAgentApplicationsFromServer } from '../api/server-service';
import { AgentApplicationsTable } from './applications-table';

export default async function AgentApplicationListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');

  const filters = { page, limit: pageLimit, ...(status && { status }) };

  const queryClient = getQueryClient();
  try {
    await queryClient.prefetchQuery({ queryKey: agentKeys.applications(filters), queryFn: () => getAgentApplicationsFromServer(filters) });
  } catch {
    // 后端未启动、未登录或网络失败时跳过 SSR 数据，由客户端 useSuspenseQuery 重试
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AgentApplicationsTable />
    </HydrationBoundary>
  );
}
