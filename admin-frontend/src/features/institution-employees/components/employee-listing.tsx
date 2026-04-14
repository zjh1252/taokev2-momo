import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { instEmployeeKeys } from '../api/queries';
import { getInstEmployeesFromServer } from '../api/server-service';
import { EmployeesTable } from './employees-table';

export default function EmployeeListingPage() {
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
    queryKey: instEmployeeKeys.list(filters),
    queryFn: () => getInstEmployeesFromServer(filters)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EmployeesTable />
    </HydrationBoundary>
  );
}
