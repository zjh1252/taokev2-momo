import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { assistantKeys } from '../api/queries';
import { getAssistantsFromServer } from '../api/server-service';
import { AssistantsTable } from './assistants-table';

export default function AssistantListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const filters = { page, limit: pageLimit, ...(search && { search }) };

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery({
    queryKey: assistantKeys.list(filters),
    queryFn: () => getAssistantsFromServer(filters)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AssistantsTable />
    </HydrationBoundary>
  );
}
