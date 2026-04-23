import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import { buildCertParams } from './service';
import type {
  CertFilters,
  AdminRealNameCert,
  AdminProfessionalCert,
  AdminEducationCert,
  AdminWorkCert
} from './types';

type Page<T> = { total: number; page: number; size: number; list: T[] };

export async function getRealNameCertsFromServer(filters: CertFilters) {
  const params = buildCertParams(filters);
  return serverFetch<Page<AdminRealNameCert>>(
    `/admin/trainers/certifications/real-name?${params.toString()}`
  );
}

export async function getProfessionalCertsFromServer(filters: CertFilters) {
  const params = buildCertParams(filters);
  return serverFetch<Page<AdminProfessionalCert>>(
    `/admin/trainers/certifications/professional?${params.toString()}`
  );
}

export async function getEducationCertsFromServer(filters: CertFilters) {
  const params = buildCertParams(filters);
  return serverFetch<Page<AdminEducationCert>>(
    `/admin/trainers/certifications/educations?${params.toString()}`
  );
}

export async function getWorkCertsFromServer(filters: CertFilters) {
  const params = buildCertParams(filters);
  return serverFetch<Page<AdminWorkCert>>(
    `/admin/trainers/certifications/work-experiences?${params.toString()}`
  );
}
