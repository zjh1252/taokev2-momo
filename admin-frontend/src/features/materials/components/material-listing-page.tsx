import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import type { MaterialType } from '../constants';
import { materialsQueryOptions } from '../api/queries';
import { MaterialListing } from './material-listing';

export default async function MaterialListingPage() {
  const page = searchParamsCache.get('page');
  const perPage = searchParamsCache.get('perPage');
  const name = searchParamsCache.get('name');
  const category = searchParamsCache.get('category');
  const scene = searchParamsCache.get('scene');
  const isDefault = searchParamsCache.get('isDefault');
  const tab = searchParamsCache.get('tab');

  const materialType: MaterialType = tab === 'avatar' ? 'AVATAR' : 'COVER';

  const filters = {
    page,
    limit: perPage,
    materialType,
    ...(name && { keyword: name }),
    ...(category && { category }),
    ...(scene && { scene }),
    ...(isDefault && { isDefault })
  };

  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery(materialsQueryOptions(filters));
  } catch {
    // 后端未启动、未登录或网络失败时跳过 SSR 数据，由客户端 useQuery 重试
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MaterialListing />
    </HydrationBoundary>
  );
}
