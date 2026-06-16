import { queryOptions } from '@tanstack/react-query';
import { getAgentWorkCerts } from './service';
import type { RoleCertFilters } from './types';

export const agentCertKeys = {
  all: ['agent-certifications'] as const,
  work: (filters: RoleCertFilters) =>
    [...agentCertKeys.all, 'work', filters] as const
};

export const agentWorkQueryOptions = (filters: RoleCertFilters) =>
  queryOptions({
    queryKey: agentCertKeys.work(filters),
    queryFn: () => getAgentWorkCerts(filters)
  });
