import { queryOptions } from '@tanstack/react-query';
import { getCategoryTree } from './service';

export const categoryKeys = {
  all: ['categories'] as const,
  tree: (type: string) => [...categoryKeys.all, 'tree', type] as const
};

export const categoryTreeQueryOptions = (type: string) =>
  queryOptions({
    queryKey: categoryKeys.tree(type),
    queryFn: () => getCategoryTree(type)
  });
