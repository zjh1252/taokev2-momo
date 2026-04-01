import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { userKeys } from '../api/queries';
import { getUsersFromServer } from '../api/server-service';
import { UsersTable } from './users-table';

export default function UserListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('nickname');
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
    queryKey: userKeys.list(filters),
    queryFn: () => getUsersFromServer(filters)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersTable />
    </HydrationBoundary>
  );
}
