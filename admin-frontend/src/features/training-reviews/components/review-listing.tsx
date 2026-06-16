import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { trainingReviewKeys } from '../api/queries';
import { getTrainingReviewsFromServer } from '../api/server-service';
import { TrainingReviewsTable } from './training-reviews-table';

/**
 * 须为 async：先 await 预取再 dehydrate。
 * <p>全局 {@link getQueryClient} 会 dehydrate pending 查询；若未等待预取完成就 dehydrate，
 * 会在客户端出现 “dehydrated as pending ended up rejecting”。</p>
 */
export default async function ReviewListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');
  const reviewScope = searchParamsCache.get('reviewScope');
  const reviewerKeyword = searchParamsCache.get('reviewerKeyword');
  const reviewedBy = searchParamsCache.get('reviewedBy');

  const filters = {
    page,
    limit: pageLimit,
    ...(status && { status }),
    ...(reviewScope && { reviewScope }),
    ...(reviewerKeyword && { reviewerKeyword }),
    ...(reviewedBy && { reviewedBy })
  };

  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: trainingReviewKeys.list(filters),
      queryFn: () => getTrainingReviewsFromServer(filters)
    });
  } catch {
    // 后端未启动、未登录或网络失败时跳过 SSR 数据，由客户端 useSuspenseQuery 重试
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TrainingReviewsTable />
    </HydrationBoundary>
  );
}
