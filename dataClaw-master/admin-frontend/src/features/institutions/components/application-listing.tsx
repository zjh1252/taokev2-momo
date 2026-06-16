import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { institutionKeys } from '../api/queries';
import { getInstitutionApplicationsFromServer } from '../api/server-service';
import { InstitutionApplicationsTable } from './applications-table';

export default function InstitutionApplicationListingPage() {
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
    queryKey: institutionKeys.applications(filters),
    queryFn: () => getInstitutionApplicationsFromServer(filters)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InstitutionApplicationsTable />
    </HydrationBoundary>
  );
}
