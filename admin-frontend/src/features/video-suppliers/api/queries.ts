import { queryOptions } from '@tanstack/react-query';
import {
  getVideoSuppliers,
  getSupplierCategories,
  getSupplierVideos
} from './service';
import type { VideoSupplierFilters } from './types';

export const videoSupplierKeys = {
  all: ['video-suppliers'] as const,
  list: (filters: VideoSupplierFilters) =>
    [...videoSupplierKeys.all, 'list', filters] as const,
  categories: (supplierId: number) =>
    [...videoSupplierKeys.all, 'categories', supplierId] as const,
  videos: (supplierId: number, page: number) =>
    [...videoSupplierKeys.all, 'videos', supplierId, page] as const
};

export const videoSuppliersQueryOptions = (filters: VideoSupplierFilters) =>
  queryOptions({
    queryKey: videoSupplierKeys.list(filters),
    queryFn: () => getVideoSuppliers(filters)
  });

export const supplierCategoriesQueryOptions = (supplierId: number) =>
  queryOptions({
    queryKey: videoSupplierKeys.categories(supplierId),
    queryFn: () => getSupplierCategories(supplierId)
  });

export const supplierVideosQueryOptions = (supplierId: number, page: number) =>
  queryOptions({
    queryKey: videoSupplierKeys.videos(supplierId, page),
    queryFn: () => getSupplierVideos(supplierId, page)
  });
