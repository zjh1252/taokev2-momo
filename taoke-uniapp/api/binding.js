import http from '@/utils/request';

/** 绑定状态 */
export const BINDING_STATUS = {
  ACTIVE: 1,
  PENDING: 2,
  UNBOUND: 3,
  REJECTED: 4,
};

export const BINDING_STATUS_LABEL = {
  1: '已生效',
  2: '待确认',
  3: '已解绑',
  4: '已拒绝',
};

export const initiateBinding = (payload) => http.post('/bindings', payload, { silent: true });

export const unbind = (type, id) => http.post(`/bindings/${type}/${id}/unbind`);

export const confirmBindingByTrainer = (type, id) =>
  http.post(`/trainers/me/bindings/${type}/${id}/confirm`);

export const rejectBindingByTrainer = (type, id, reason) =>
  http.post(`/trainers/me/bindings/${type}/${id}/reject`, { reason });

export const confirmBindingByEmployee = (id) =>
  http.post(`/employees/me/bindings/${id}/confirm`);

export const rejectBindingByEmployee = (id, reason) =>
  http.post(`/employees/me/bindings/${id}/reject`, { reason });

export const confirmBindingByAgent = (id) =>
  http.post(`/agents/me/bindings/${id}/confirm`);

export const rejectBindingByAgent = (id, reason) =>
  http.post(`/agents/me/bindings/${id}/reject`, { reason });

export const approveEmployeeByInstitution = (id) =>
  http.post(`/institutions/me/employees/${id}/approve`);

export const rejectEmployeeByInstitution = (id, reason) =>
  http.post(`/institutions/me/employees/${id}/reject`, { reason });

export const approveAgentByEnterprise = (id) =>
  http.post(`/enterprise-agents/me/members/${id}/approve`);

export const rejectAgentByEnterprise = (id, reason) =>
  http.post(`/enterprise-agents/me/members/${id}/reject`, { reason });

export const listMyAgents = () => http.get('/trainers/me/agents');
export const listMyBindingRequests = () => http.get('/trainers/me/binding-requests');
export const listManagedTrainers = () => http.get('/me/managed-trainers');
export const listInstitutionTrainers = () => http.get('/institutions/me/trainers');
export const listInstitutionEmployees = () => http.get('/institutions/me/employees');
export const listEnterpriseAgentTrainers = () => http.get('/enterprise-agents/me/trainers');
export const listAgentTrainers = () => http.get('/agents/me/trainers');
export const listAssistantTrainers = () => http.get('/assistants/me/trainers');
export const listEnterpriseAgentMembers = () => http.get('/enterprise-agents/me/members');
export const listMyEnterpriseAgents = () => http.get('/agents/me/enterprises');
export const listMyInstitutions = () => http.get('/employees/me/institutions');
export const listEmployeeInstitutionTrainers = () => http.get('/employees/me/institution-trainers');

export const lookupUserByPhone = (phone) =>
  http.get('/bindings/users/lookup', { phone }, { silent: true });

/** 按当前 activeRole 选择「我的专家」列表接口 */
export function listMyExpertsByRole(activeRole) {
  switch (activeRole) {
    case 'INSTITUTION':
      return listInstitutionTrainers();
    case 'ENTERPRISE_AGENT':
      return listEnterpriseAgentTrainers();
    case 'AGENT':
      return listAgentTrainers();
    case 'ASSISTANT':
      return listAssistantTrainers();
    case 'INSTITUTION_EMPLOYEE':
      return listEmployeeInstitutionTrainers();
    default:
      return Promise.resolve([]);
  }
}

/** 按 activeRole 映射发起绑定时的 bindingType */
export function mapRoleToExpertBindingType(activeRole) {
  switch (activeRole) {
    case 'INSTITUTION':
    case 'INSTITUTION_EMPLOYEE':
      return 'INSTITUTION_TRAINER';
    case 'ENTERPRISE_AGENT':
      return 'ENTERPRISE_AGENT_TRAINER';
    case 'AGENT':
      return 'AGENT_TRAINER';
    case 'ASSISTANT':
      return 'ASSISTANT_TRAINER';
    default:
      return null;
  }
}
