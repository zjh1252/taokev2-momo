import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import type { AgentFilters, AgentsResponse, AgentApplicationsResponse } from './types';
import { buildAgentParams } from './service';

export async function getAgentsFromServer(filters: AgentFilters): Promise<AgentsResponse> {
  const params = buildAgentParams(filters);
  return serverFetch(`/admin/agents?${params.toString()}`) as Promise<AgentsResponse>;
}

export async function getAgentApplicationsFromServer(filters: AgentFilters): Promise<AgentApplicationsResponse> {
  const params = buildAgentParams(filters);
  return serverFetch(`/admin/agents/applications?${params.toString()}`) as Promise<AgentApplicationsResponse>;
}
