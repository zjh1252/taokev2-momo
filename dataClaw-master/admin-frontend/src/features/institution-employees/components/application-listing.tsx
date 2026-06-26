import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { instEmployeeKeys } from '../api/queries';
import { getInstEmployeeApplicationsFromServer } from '../api/server-service';
import { EmployeeApplicationsTable } from './applications-table';

export default function EmployeeApplicationListingPage() {
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
    queryKey: instEmployeeKeys.applications(filters),
    queryFn: () => getInstEmployeeApplicationsFromServer(filters)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EmployeeApplicationsTable />
    </HydrationBoundary>
  );
}
