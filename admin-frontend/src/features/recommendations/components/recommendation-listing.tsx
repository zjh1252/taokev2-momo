'use client';

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import { getQueryClient } from '@/lib/query-client';
import {
  recommendationSlotsQueryOptions,
  recommendationsQueryOptions,
  recommendationSlotConfigQueryOptions
} from '../api/queries';
import type { RecommendationManagerConfig } from '../api/types';
import { RecommendationManager } from './recommendation-manager';

function RecommendationManagerSkeleton() {
  return (
    <div className='text-muted-foreground flex flex-1 items-center justify-center py-20 text-sm'>
      加载推荐配置…
    </div>
  );
}

export function RecommendationListing({ config }: { config: RecommendationManagerConfig }) {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(recommendationSlotsQueryOptions(config.resourceType));
  void queryClient.prefetchQuery(
    recommendationsQueryOptions(config.defaultSlotCode)
  );
  if (config.defaultSlotCode === 'HOME_TRAINER') {
    void queryClient.prefetchQuery(recommendationSlotConfigQueryOptions('HOME_TRAINER'));
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<RecommendationManagerSkeleton />}>
        <RecommendationManager config={config} />
      </Suspense>
    </HydrationBoundary>
  );
}
