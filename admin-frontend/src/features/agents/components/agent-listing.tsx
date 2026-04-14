import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { agentKeys } from '../api/queries';
import { getAgentsFromServer } from '../api/server-service';
import { AgentsTable } from './agents-table';

export default function AgentListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');

  const filters = { page, limit: pageLimit, ...(search && { search }) };

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery({ queryKey: agentKeys.list(filters), queryFn: () => getAgentsFromServer(filters) });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AgentsTable />
    </HydrationBoundary>
  );
}
