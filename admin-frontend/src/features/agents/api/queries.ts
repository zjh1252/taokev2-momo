import { queryOptions } from '@tanstack/react-query';
import { getAgents, getAgentApplications } from './service';
import type { AgentFilters } from './types';

export const agentKeys = {
  all: ['agents'] as const,
  list: (filters: AgentFilters) => [...agentKeys.all, 'list', filters] as const,
  applications: (filters: AgentFilters) => [...agentKeys.all, 'applications', filters] as const
};

export const agentsQueryOptions = (filters: AgentFilters) =>
  queryOptions({ queryKey: agentKeys.list(filters), queryFn: () => getAgents(filters) });

export const agentApplicationsQueryOptions = (filters: AgentFilters) =>
  queryOptions({ queryKey: agentKeys.applications(filters), queryFn: () => getAgentApplications(filters) });
