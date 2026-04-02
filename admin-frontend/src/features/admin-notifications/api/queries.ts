import { queryOptions } from '@tanstack/react-query';
import { getTemplates } from './service';

export const templateKeys = {
  all: ['notification-templates'] as const,
  list: () => [...templateKeys.all, 'list'] as const
};

export const templateListQueryOptions = queryOptions({
  queryKey: templateKeys.list(),
  queryFn: () => getTemplates()
});
