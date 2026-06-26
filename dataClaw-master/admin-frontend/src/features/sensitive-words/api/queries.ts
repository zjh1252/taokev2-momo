import { queryOptions } from '@tanstack/react-query';
import { getSensitiveWords } from './service';
import type { SensitiveWordFilters } from './types';

export const sensitiveWordKeys = {
  all: ['sensitive-words'] as const,
  list: (filters: SensitiveWordFilters) =>
    [...sensitiveWordKeys.all, 'list', filters] as const
};

export const sensitiveWordsQueryOptions = (filters: SensitiveWordFilters) =>
  queryOptions({
    queryKey: sensitiveWordKeys.list(filters),
    queryFn: () => getSensitiveWords(filters)
  });
