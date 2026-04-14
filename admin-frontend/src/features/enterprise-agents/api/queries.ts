import { queryOptions } from '@tanstack/react-query';
import { getEnterpriseAgents, getEnterpriseAgentApplications } from './service';
import type { EnterpriseAgentFilters } from './types';

export const eaKeys = {
  all: ['enterprise-agents'] as const,
  list: (filters: EnterpriseAgentFilters) => [...eaKeys.all, 'list', filters] as const,
  applications: (filters: EnterpriseAgentFilters) => [...eaKeys.all, 'applications', filters] as const
};

export const eaQueryOptions = (filters: EnterpriseAgentFilters) =>
  queryOptions({ queryKey: eaKeys.list(filters), queryFn: () => getEnterpriseAgents(filters) });

export const eaApplicationsQueryOptions = (filters: EnterpriseAgentFilters) =>
  queryOptions({ queryKey: eaKeys.applications(filters), queryFn: () => getEnterpriseAgentApplications(filters) });
