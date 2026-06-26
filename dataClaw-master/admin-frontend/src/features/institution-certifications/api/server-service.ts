import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import { buildParams } from './service';
import type {
  InstitutionCertFilters,
  AdminInstitutionCompanyInfo
} from './types';

type Page<T> = { total: number; page: number; size: number; list: T[] };

export async function getInstitutionCompanyInfosFromServer(
  filters: InstitutionCertFilters
) {
  const params = buildParams(filters);
  return serverFetch<Page<AdminInstitutionCompanyInfo>>(
    `/admin/institutions/company-info?${params.toString()}`
  );
}
