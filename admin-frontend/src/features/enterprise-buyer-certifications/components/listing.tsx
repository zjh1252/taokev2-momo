import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { buyerCertKeys } from '../api/queries';
import {
  getBuyerRealNameCertsFromServer,
  getBuyerWorkCertsFromServer
} from '../api/server-service';
import { BuyerRealNameCertTable } from './real-name-table';
import { BuyerWorkCertTable } from './work-table';
import type { BuyerCertTabId } from './buyer-cert-tabs-nav';

export default async function BuyerCertListingPage({ dimension }: { dimension: BuyerCertTabId }) {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');

  const filters = {
    page,
    limit: pageLimit,
    ...(status && { status })
  };

  const queryClient = getQueryClient();
  let table: React.ReactNode;

  if (dimension === 'real-name') {
    try {
      await queryClient.prefetchQuery({
        queryKey: buyerCertKeys.realName(filters),
        queryFn: () => getBuyerRealNameCertsFromServer(filters)
      });
    } catch {
      // SSR 跳过时由客户端重试
    }
    table = <BuyerRealNameCertTable />;
  } else {
    try {
      await queryClient.prefetchQuery({
        queryKey: buyerCertKeys.work(filters),
        queryFn: () => getBuyerWorkCertsFromServer(filters)
      });
    } catch {
      // SSR 跳过时由客户端重试
    }
    table = <BuyerWorkCertTable />;
  }

  return <HydrationBoundary state={dehydrate(queryClient)}>{table}</HydrationBoundary>;
}
