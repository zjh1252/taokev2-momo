import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { assistantKeys } from '../api/queries';
import { getAssistantApplicationsFromServer } from '../api/server-service';
import { AssistantApplicationsTable } from './applications-table';

export default function AssistantApplicationListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');
  const filters = { page, limit: pageLimit, ...(status && { status }) };

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery({
    queryKey: assistantKeys.applications(filters),
    queryFn: () => getAssistantApplicationsFromServer(filters)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AssistantApplicationsTable />
    </HydrationBoundary>
  );
}
