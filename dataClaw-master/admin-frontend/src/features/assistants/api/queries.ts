import { queryOptions } from '@tanstack/react-query';
import { getAssistants } from './service';
import type { AssistantFilters } from './types';

export const assistantKeys = {
  all: ['assistants'] as const,
  list: (filters: AssistantFilters) =>
    [...assistantKeys.all, 'list', filters] as const
};

export const assistantsQueryOptions = (filters: AssistantFilters) =>
  queryOptions({
    queryKey: assistantKeys.list(filters),
    queryFn: () => getAssistants(filters)
  });
