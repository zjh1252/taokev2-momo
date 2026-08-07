import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { videoKeys } from '../api/queries';
import { getVideosFromServer } from '../api/server-service';
import { VideosTable } from './videos-table';

function parseSortFromSearchParam(sortRaw: string | null) {
  if (!sortRaw) return {};
  try {
    const parsed = JSON.parse(sortRaw) as { id: string; desc: boolean }[];
    const sortItem = parsed?.[0];
    if (!sortItem || sortItem.id !== 'createdAt') return {};
    return {
      sortBy: 'createdAt',
      sortDirection: sortItem.desc ? 'DESC' : 'ASC'
    };
  } catch {
    return {};
  }
}

export default async function VideoListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');
  const sortRaw = searchParamsCache.get('sort');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(status && { status }),
    ...parseSortFromSearchParam(sortRaw)
  };

  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: videoKeys.list(filters),
      queryFn: () => getVideosFromServer(filters)
    });
  } catch {
    // 后端未启动、未登录或网络失败时跳过 SSR 数据，由客户端 useSuspenseQuery 重试
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <VideosTable />
    </HydrationBoundary>
  );
}
