import { queryOptions } from '@tanstack/react-query';
import type { BookFilters } from './types';
import { getBooks } from './service';

export const bookKeys = {
  all: ['books'] as const,
  list: (filters: BookFilters) => [...bookKeys.all, 'list', filters] as const,
  detail: (id: number) => [...bookKeys.all, 'detail', id] as const
};

export const booksQueryOptions = (filters: BookFilters) =>
  queryOptions({
    queryKey: bookKeys.list(filters),
    queryFn: () => getBooks(filters)
  });
