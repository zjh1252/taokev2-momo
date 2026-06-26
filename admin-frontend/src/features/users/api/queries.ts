import { queryOptions } from '@tanstack/react-query';
import { getUserDetail, getUsers } from './service';
import type { User, UserDetail, UserFilters } from './types';

export type { User, UserDetail };

export const userKeys = {
  all: ['users'] as const,
  list: (filters: UserFilters) => [...userKeys.all, 'list', filters] as const,
  detail: (id: number) => [...userKeys.all, 'detail', id] as const
};

export const usersQueryOptions = (filters: UserFilters) =>
  queryOptions({
    queryKey: userKeys.list(filters),
    queryFn: () => getUsers(filters)
  });

export const userDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: userKeys.detail(id),
    queryFn: () => getUserDetail(id)
  });
