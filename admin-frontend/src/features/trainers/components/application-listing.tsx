import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { trainerKeys } from '../api/queries';
import { getApplicationsFromServer } from '../api/server-service';
import { ApplicationsTable } from './applications-table';

export default function ApplicationListingPage() {
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
    queryKey: trainerKeys.applications(filters),
    queryFn: () => getApplicationsFromServer(filters)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ApplicationsTable />
    </HydrationBoundary>
  );
}
