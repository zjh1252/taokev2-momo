import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { enterpriseBuyerKeys } from '../api/queries';
import { getEnterpriseBuyersFromServer } from '../api/server-service';
import { EnterpriseBuyersTable } from './enterprise-buyers-table';

export default function EnterpriseBuyerListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search })
  };

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery({
    queryKey: enterpriseBuyerKeys.list(filters),
    queryFn: () => getEnterpriseBuyersFromServer(filters)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EnterpriseBuyersTable />
    </HydrationBoundary>
  );
}
