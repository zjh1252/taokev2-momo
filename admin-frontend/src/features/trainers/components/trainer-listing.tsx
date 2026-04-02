import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { trainerKeys } from '../api/queries';
import { getTrainersFromServer } from '../api/server-service';
import { TrainersTable } from './trainers-table';

export default function TrainerListingPage() {
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
    queryKey: trainerKeys.list(filters),
    queryFn: () => getTrainersFromServer(filters)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TrainersTable />
    </HydrationBoundary>
  );
}
