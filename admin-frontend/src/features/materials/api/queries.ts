import { queryOptions } from '@tanstack/react-query';
import { getMaterials } from './service';
import type { Material, MaterialFilters } from './types';

export type { Material, MaterialFilters };

export const materialKeys = {
  all: ['materials'] as const,
  list: (filters: MaterialFilters) => [...materialKeys.all, 'list', filters] as const
};

export const materialsQueryOptions = (filters: MaterialFilters) =>
  queryOptions({
    queryKey: materialKeys.list(filters),
    queryFn: () => getMaterials(filters)
  });
