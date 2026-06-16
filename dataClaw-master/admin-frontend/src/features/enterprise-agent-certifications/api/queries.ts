import { queryOptions } from '@tanstack/react-query';
import { getEnterpriseAgentCerts } from './service';
import type { EnterpriseAgentCertFilters } from './types';

export const entAgentCertKeys = {
  all: ['enterprise-agent-certifications'] as const,
  qualification: (filters: EnterpriseAgentCertFilters) =>
    [...entAgentCertKeys.all, 'qualification', filters] as const
};

export const entAgentQualQueryOptions = (filters: EnterpriseAgentCertFilters) =>
  queryOptions({
    queryKey: entAgentCertKeys.qualification(filters),
    queryFn: () => getEnterpriseAgentCerts(filters)
  });
