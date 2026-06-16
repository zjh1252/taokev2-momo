import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { entAgentCertKeys } from '../api/queries';
import { getEnterpriseAgentCertsFromServer } from '../api/server-service';
import { EnterpriseAgentQualificationTable } from './qualification-table';

export default function EnterpriseAgentCertListingPage() {
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
    queryKey: entAgentCertKeys.qualification(filters),
    queryFn: () => getEnterpriseAgentCertsFromServer(filters)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EnterpriseAgentQualificationTable />
    </HydrationBoundary>
  );
}
