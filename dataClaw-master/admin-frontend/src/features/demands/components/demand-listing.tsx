import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { demandKeys } from '../api/queries';
import { getDemandsFromServer } from '../api/server-service';
import { DemandsTable } from './demands-table';

export default function DemandListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { keyword: search })
  };

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery({
    queryKey: demandKeys.list(filters),
    queryFn: () => getDemandsFromServer(filters)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DemandsTable />
    </HydrationBoundary>
  );
}
