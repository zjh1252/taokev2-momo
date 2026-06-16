import { queryOptions } from '@tanstack/react-query';
import { getInstitutionCompanyInfos } from './service';
import type { InstitutionCertFilters } from './types';

export const institutionCertKeys = {
  all: ['institution-certifications'] as const,
  companyInfo: (filters: InstitutionCertFilters) =>
    [...institutionCertKeys.all, 'company-info', filters] as const
};

export const institutionCompanyInfoQueryOptions = (
  filters: InstitutionCertFilters
) =>
  queryOptions({
    queryKey: institutionCertKeys.companyInfo(filters),
    queryFn: () => getInstitutionCompanyInfos(filters)
  });
