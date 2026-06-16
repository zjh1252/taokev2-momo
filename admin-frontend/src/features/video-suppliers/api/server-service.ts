import { serverFetch } from '@/lib/server-fetch';
import type { VideoSupplierFilters, VideoSuppliersResponse } from './types';
import { buildSupplierParams } from './service';

export async function getVideoSuppliersFromServer(
  filters: VideoSupplierFilters
): Promise<VideoSuppliersResponse> {
  const params = buildSupplierParams(filters);
  return serverFetch<VideoSuppliersResponse['data']>(
    `/admin/video-suppliers?${params.toString()}`
  ) as Promise<VideoSuppliersResponse>;
}
