import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { trainerCaseKeys } from '../api/queries';
import { getTrainerCasesFromServer } from '../api/server-service';
import { TrainerCasesTable } from './cases-table';

export default function CaseListingPage() {
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
    queryKey: trainerCaseKeys.list(filters),
    queryFn: () => getTrainerCasesFromServer(filters)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TrainerCasesTable />
    </HydrationBoundary>
  );
}
