import http from '@/utils/request';

export const getEnterpriseAgentCert = () => http.get('/enterprise-agents/me/certification');

export const submitEnterpriseAgentCert = (data) =>
  http.put('/enterprise-agents/me/certification', data);

export const getInstitutionCompanyInfo = () => http.get('/institutions/me/company-info');

export const submitInstitutionCompanyInfo = (data) =>
  http.put('/institutions/me/company-info', data);

export const listAgentWorkCerts = () =>
  http.get('/agents/me/certification/work-experiences');

export const createAgentWorkCert = (data) =>
  http.post('/agents/me/certification/work-experiences', data);

export const updateAgentWorkCert = (id, data) =>
  http.put(`/agents/me/certification/work-experiences/${id}`, data);

export const deleteAgentWorkCert = (id) =>
  http.del(`/agents/me/certification/work-experiences/${id}`);
