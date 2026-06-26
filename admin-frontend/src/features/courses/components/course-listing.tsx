import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { courseKeys } from '../api/queries';
import { getCoursesFromServer } from '../api/server-service';
import { CoursesTable } from './courses-table';

export default async function CourseListingPage() {
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

  try {
    await queryClient.prefetchQuery({
      queryKey: courseKeys.list(filters),
      queryFn: () => getCoursesFromServer(filters)
    });
  } catch {
    // 后端未启动、未登录或网络失败时跳过 SSR 数据，由客户端 useSuspenseQuery 重试
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CoursesTable />
    </HydrationBoundary>
  );
}
