import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { eaKeys } from '../api/queries';
import { getEAApplicationsFromServer } from '../api/server-service';
import { EAApplicationsTable } from './applications-table';

export default function EAApplicationListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');
  const filters = { page, limit: pageLimit, ...(status && { status }) };
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery({ queryKey: eaKeys.applications(filters), queryFn: () => getEAApplicationsFromServer(filters) });
  return (<HydrationBoundary state={dehydrate(queryClient)}><EAApplicationsTable /></HydrationBoundary>);
}
