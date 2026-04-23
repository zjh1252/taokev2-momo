import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { institutionCertKeys } from '../api/queries';
import { getInstitutionCompanyInfosFromServer } from '../api/server-service';
import { InstitutionCompanyInfoTable } from './company-info-table';

export default function InstitutionCertListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');

  const filters = {
    page,
    limit: pageLimit,
    ...(status && { status })
  };

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery({
    queryKey: institutionCertKeys.companyInfo(filters),
    queryFn: () => getInstitutionCompanyInfosFromServer(filters)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InstitutionCompanyInfoTable />
    </HydrationBoundary>
  );
}
