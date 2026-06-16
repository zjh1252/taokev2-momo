import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { courseKeys } from '../api/queries';
import { getCoursesFromServer } from '../api/server-service';
import { CoursesTable } from './courses-table';

export default function CourseListingPage() {
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
    queryKey: courseKeys.list(filters),
    queryFn: () => getCoursesFromServer(filters)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CoursesTable />
    </HydrationBoundary>
  );
}
