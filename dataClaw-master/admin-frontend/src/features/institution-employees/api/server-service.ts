import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import type {
  InstitutionEmployeeFilters,
  InstitutionEmployeesResponse,
  InstitutionEmployeeApplicationsResponse
} from './types';
import { buildInstEmployeeParams } from './service';

export async function getInstEmployeesFromServer(
  filters: InstitutionEmployeeFilters
): Promise<InstitutionEmployeesResponse> {
  const params = buildInstEmployeeParams(filters);
  return serverFetch(
    `/admin/institution-employees?${params.toString()}`
  ) as Promise<InstitutionEmployeesResponse>;
}

export async function getInstEmployeeApplicationsFromServer(
  filters: InstitutionEmployeeFilters
): Promise<InstitutionEmployeeApplicationsResponse> {
  const params = buildInstEmployeeParams(filters);
  return serverFetch(
    `/admin/institution-employees/applications?${params.toString()}`
  ) as Promise<InstitutionEmployeeApplicationsResponse>;
}
