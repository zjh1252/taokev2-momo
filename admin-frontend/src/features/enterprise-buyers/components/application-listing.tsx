import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { enterpriseBuyerKeys } from '../api/queries';
import { getEnterpriseBuyerApplicationsFromServer } from '../api/server-service';
import { EnterpriseBuyerApplicationsTable } from './applications-table';

export default function EnterpriseBuyerApplicationListingPage() {
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
    queryKey: enterpriseBuyerKeys.applications(filters),
    queryFn: () => getEnterpriseBuyerApplicationsFromServer(filters)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EnterpriseBuyerApplicationsTable />
    </HydrationBoundary>
  );
}
