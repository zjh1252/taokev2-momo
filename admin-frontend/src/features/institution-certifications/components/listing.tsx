import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { institutionCertKeys } from '../api/queries';
import { getInstitutionCompanyInfosFromServer } from '../api/server-service';
import { InstitutionCompanyInfoTable } from './company-info-table';

export default async function InstitutionCertListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');

  const filters = {
    page,
    limit: pageLimit,
    ...(status && { status })
  };

  const queryClient = getQueryClient();
  try {
    await queryClient.prefetchQuery({
      queryKey: institutionCertKeys.companyInfo(filters),
      queryFn: () => getInstitutionCompanyInfosFromServer(filters)
    });
  } catch {
    // 后端未启动、未登录或网络失败时跳过 SSR 数据，由客户端 useSuspenseQuery 重试
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InstitutionCompanyInfoTable />
    </HydrationBoundary>
  );
}
