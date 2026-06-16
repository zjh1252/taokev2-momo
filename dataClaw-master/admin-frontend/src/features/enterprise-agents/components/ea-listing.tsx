import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { eaKeys } from '../api/queries';
import { getEAFromServer } from '../api/server-service';
import { EATable } from './ea-table';

export default function EAListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const filters = { page, limit: pageLimit, ...(search && { search }) };
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery({ queryKey: eaKeys.list(filters), queryFn: () => getEAFromServer(filters) });
  return (<HydrationBoundary state={dehydrate(queryClient)}><EATable /></HydrationBoundary>);
}
