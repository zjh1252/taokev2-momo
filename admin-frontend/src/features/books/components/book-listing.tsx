import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { bookKeys } from '../api/queries';
import { getBooksFromServer } from '../api/server-service';
import { BooksTable, BooksTableSkeleton } from './books-table';

export default async function BookListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');
  const name = searchParamsCache.get('name');

  const filters = {
    page,
    limit: pageLimit,
    ...(status && { status }),
    ...(name && { search: name })
  };

  const queryClient = getQueryClient();
  try {
    await queryClient.prefetchQuery({
      queryKey: bookKeys.list(filters),
      queryFn: () => getBooksFromServer(filters)
    });
  } catch {
    // SSR 预取失败时由客户端重试
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<BooksTableSkeleton />}>
        <BooksTable />
      </Suspense>
    </HydrationBoundary>
  );
}
