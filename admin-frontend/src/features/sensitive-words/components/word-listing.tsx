import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { sensitiveWordKeys } from '../api/queries';
import { getSensitiveWordsFromServer } from '../api/server-service';
import { SensitiveWordsTable } from './words-table';

export default function WordListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const keyword = searchParamsCache.get('name');

  const filters = {
    page,
    limit: pageLimit,
    ...(keyword && { keyword })
  };

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery({
    queryKey: sensitiveWordKeys.list(filters),
    queryFn: () => getSensitiveWordsFromServer(filters)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SensitiveWordsTable />
    </HydrationBoundary>
  );
}
