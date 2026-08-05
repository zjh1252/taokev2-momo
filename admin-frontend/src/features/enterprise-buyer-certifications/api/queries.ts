import { queryOptions } from '@tanstack/react-query';
import type { RoleCertFilters } from './types';
import { getBuyerRealNameCerts, getBuyerWorkCerts } from './service';

export const buyerCertKeys = {
  all: ['buyer-certifications'] as const,
  realName: (filters: RoleCertFilters) =>
    [...buyerCertKeys.all, 'real-name', filters] as const,
  work: (filters: RoleCertFilters) => [...buyerCertKeys.all, 'work', filters] as const
};

export function buyerRealNameQueryOptions(filters: RoleCertFilters) {
  return queryOptions({
    queryKey: buyerCertKeys.realName(filters),
    queryFn: () => getBuyerRealNameCerts(filters)
  });
}

export function buyerWorkQueryOptions(filters: RoleCertFilters) {
  return queryOptions({
    queryKey: buyerCertKeys.work(filters),
    queryFn: () => getBuyerWorkCerts(filters)
  });
}
