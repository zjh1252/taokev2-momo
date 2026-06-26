import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { trainerMessageKeys } from '../api/queries';
import { getTrainerMessagesFromServer } from '../api/server-service';
import { TrainerMessagesTable } from './messages-table';

export default function MessageListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');

  const filters = {
    page,
    limit: pageLimit,
    ...(status && { status }),
  };

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery({
    queryKey: trainerMessageKeys.list(filters),
    queryFn: () => getTrainerMessagesFromServer(filters),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TrainerMessagesTable />
    </HydrationBoundary>
  );
}
