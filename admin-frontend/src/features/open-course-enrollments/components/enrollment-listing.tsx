import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { openCourseEnrollmentKeys } from '../api/queries';
import { getOpenCourseEnrollmentsFromServer } from '../api/server-service';
import { OpenCourseEnrollmentsTable } from './enrollments-table';

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
      queryKey: openCourseEnrollmentKeys.list(filters),
      queryFn: () => getOpenCourseEnrollmentsFromServer(filters),
    });
  } catch {
    // 后端未启动时跳过 SSR
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OpenCourseEnrollmentsTable />
    </HydrationBoundary>
  );
}
