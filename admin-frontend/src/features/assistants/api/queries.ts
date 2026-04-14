import { queryOptions } from '@tanstack/react-query';
import { getAssistants, getAssistantApplications } from './service';
import type { AssistantFilters } from './types';

export const assistantKeys = {
  all: ['assistants'] as const,
  list: (filters: AssistantFilters) =>
    [...assistantKeys.all, 'list', filters] as const,
  applications: (filters: AssistantFilters) =>
    [...assistantKeys.all, 'applications', filters] as const
};

export const assistantsQueryOptions = (filters: AssistantFilters) =>
  queryOptions({
    queryKey: assistantKeys.list(filters),
    queryFn: () => getAssistants(filters)
  });

export const assistantApplicationsQueryOptions = (filters: AssistantFilters) =>
  queryOptions({
    queryKey: assistantKeys.applications(filters),
    queryFn: () => getAssistantApplications(filters)
  });
