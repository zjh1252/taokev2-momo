import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { trainerHighlightKeys } from '../api/queries';
import { getTrainerHighlightsFromServer } from '../api/server-service';
import { TrainerHighlightsTable } from './highlights-table';

export default function HighlightListingPage() {
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
    queryKey: trainerHighlightKeys.list(filters),
    queryFn: () => getTrainerHighlightsFromServer(filters)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TrainerHighlightsTable />
    </HydrationBoundary>
  );
}
