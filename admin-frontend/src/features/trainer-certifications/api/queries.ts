import { queryOptions } from '@tanstack/react-query';
import {
  getRealNameCerts,
  getProfessionalCerts,
  getEducationCerts,
  getWorkCerts
} from './service';
import type { CertFilters } from './types';

export const certKeys = {
  all: ['trainer-certifications'] as const,
  realName: (filters: CertFilters) =>
    [...certKeys.all, 'real-name', filters] as const,
  professional: (filters: CertFilters) =>
    [...certKeys.all, 'professional', filters] as const,
  education: (filters: CertFilters) =>
    [...certKeys.all, 'education', filters] as const,
  work: (filters: CertFilters) => [...certKeys.all, 'work', filters] as const
};

export const realNameQueryOptions = (filters: CertFilters) =>
  queryOptions({
    queryKey: certKeys.realName(filters),
    queryFn: () => getRealNameCerts(filters)
  });

export const professionalQueryOptions = (filters: CertFilters) =>
  queryOptions({
    queryKey: certKeys.professional(filters),
    queryFn: () => getProfessionalCerts(filters)
  });

export const educationQueryOptions = (filters: CertFilters) =>
  queryOptions({
    queryKey: certKeys.education(filters),
    queryFn: () => getEducationCerts(filters)
  });

export const workQueryOptions = (filters: CertFilters) =>
  queryOptions({
    queryKey: certKeys.work(filters),
    queryFn: () => getWorkCerts(filters)
  });
