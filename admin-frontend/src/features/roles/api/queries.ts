import { queryOptions } from '@tanstack/react-query';
import { getRoles } from './service';

export const roleKeys = {
  all: ['roles'] as const,
  list: () => [...roleKeys.all, 'list'] as const
};

export const rolesQueryOptions = () =>
  queryOptions({
    queryKey: roleKeys.list(),
    queryFn: () => getRoles()
  });
