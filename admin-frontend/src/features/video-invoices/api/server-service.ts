import { serverFetch } from '@/lib/server-fetch';
import type { VideoInvoiceFilters, VideoInvoicesResponse } from './types';
import { buildVideoInvoiceParams } from './service';

export async function getVideoInvoicesFromServer(
  filters: VideoInvoiceFilters
): Promise<VideoInvoicesResponse> {
  const params = buildVideoInvoiceParams(filters);
  return serverFetch<VideoInvoicesResponse['data']>(
    `/admin/video-invoices?${params.toString()}`
  ) as Promise<VideoInvoicesResponse>;
}
