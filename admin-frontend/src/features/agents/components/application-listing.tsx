import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { agentKeys } from '../api/queries';
import { getAgentApplicationsFromServer } from '../api/server-service';
import { AgentApplicationsTable } from './applications-table';

export default function AgentApplicationListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');

  const filters = { page, limit: pageLimit, ...(status && { status }) };

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery({ queryKey: agentKeys.applications(filters), queryFn: () => getAgentApplicationsFromServer(filters) });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AgentApplicationsTable />
    </HydrationBoundary>
  );
}
