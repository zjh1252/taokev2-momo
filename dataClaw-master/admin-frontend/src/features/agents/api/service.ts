import { apiClient } from '@/lib/api-client';
import type { AgentFilters, AgentsResponse, AgentApplicationsResponse } from './types';

export function buildAgentParams(filters: AgentFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  return params;
}

export async function getAgents(filters: AgentFilters): Promise<AgentsResponse> {
  const params = buildAgentParams(filters);
  return apiClient<AgentsResponse>(`/agents?${params.toString()}`);
}

export async function getAgentApplications(filters: AgentFilters): Promise<AgentApplicationsResponse> {
  const params = buildAgentParams(filters);
  return apiClient<AgentApplicationsResponse>(`/agents/applications?${params.toString()}`);
}

export async function approveAgentApplication(userId: number) {
  return apiClient<{ code: number; message: string }>(`/agents/applications/${userId}/approve`, { method: 'PUT' });
}

export async function rejectAgentApplication(userId: number, reason: string) {
  return apiClient<{ code: number; message: string }>(`/agents/applications/${userId}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) });
}
