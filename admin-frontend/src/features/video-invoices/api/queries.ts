import { queryOptions } from '@tanstack/react-query';
import { getVideoInvoices } from './service';
import type { VideoInvoiceFilters } from './types';

export const videoInvoiceKeys = {
  all: ['video-invoices'] as const,
  list: (filters: VideoInvoiceFilters) =>
    [...videoInvoiceKeys.all, 'list', filters] as const
};

export const videoInvoicesQueryOptions = (filters: VideoInvoiceFilters) =>
  queryOptions({
    queryKey: videoInvoiceKeys.list(filters),
    queryFn: () => getVideoInvoices(filters)
  });
