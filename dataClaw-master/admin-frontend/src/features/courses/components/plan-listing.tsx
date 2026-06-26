import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { courseKeys } from '../api/queries';
import { getPlansFromServer } from '../api/server-service';
import { PlansTable } from './plans-table';

export default function PlanListingPage() {
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
    queryKey: courseKeys.plans(filters),
    queryFn: () => getPlansFromServer(filters)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PlansTable />
    </HydrationBoundary>
  );
}
