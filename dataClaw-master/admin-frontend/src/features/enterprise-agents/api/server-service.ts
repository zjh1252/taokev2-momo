import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import type { EnterpriseAgentFilters, EnterpriseAgentsResponse, EnterpriseAgentApplicationsResponse } from './types';
import { buildEAParams } from './service';

export async function getEAFromServer(filters: EnterpriseAgentFilters): Promise<EnterpriseAgentsResponse> {
  return serverFetch(`/admin/enterprise-agents?${buildEAParams(filters).toString()}`) as Promise<EnterpriseAgentsResponse>;
}

export async function getEAApplicationsFromServer(filters: EnterpriseAgentFilters): Promise<EnterpriseAgentApplicationsResponse> {
  return serverFetch(`/admin/enterprise-agents/applications?${buildEAParams(filters).toString()}`) as Promise<EnterpriseAgentApplicationsResponse>;
}
