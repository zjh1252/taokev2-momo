import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { institutionKeys } from '../api/queries';
import { getInstitutionsFromServer } from '../api/server-service';
import { InstitutionsTable } from './institutions-table';

export default function InstitutionListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(status && { status })
  };

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery({
    queryKey: institutionKeys.list(filters),
    queryFn: () => getInstitutionsFromServer(filters)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InstitutionsTable />
    </HydrationBoundary>
  );
}
