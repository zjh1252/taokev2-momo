import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { internalCourseEnrollmentKeys } from '../api/queries';
import { getInternalCourseEnrollmentsFromServer } from '../api/server-service';
import { InternalCourseEnrollmentsTable } from './enrollments-table';

export default async function EnrollmentListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');
  const keyword = searchParamsCache.get('keyword');

  const filters = {
    page,
    limit: pageLimit,
    ...(status && { status }),
    ...(keyword && { keyword }),
  };

  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: internalCourseEnrollmentKeys.list(filters),
      queryFn: () => getInternalCourseEnrollmentsFromServer(filters),
    });
  } catch {
    // 后端未启动时跳过 SSR
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InternalCourseEnrollmentsTable />
    </HydrationBoundary>
  );
}
