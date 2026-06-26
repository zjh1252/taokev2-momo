export type EnterpriseAgentCertFilters = {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
};

export const ENT_AGENT_CERT_STATUS_MAP: Record<number, string> = {
  1: '待审核',
  2: '已通过',
  3: '已驳回'
};

export const ENT_AGENT_CERT_STATUS_OPTIONS = [
  { value: '1', label: '待审核' },
  { value: '2', label: '已通过' },
  { value: '3', label: '已驳回' }
];

export type EnterpriseAgentCertPage<T> = {
  code: number;
  message: string;
  data: { total: number; page: number; size: number; list: T[] };
};

/** 经纪公司资质认证审核行 */
export type AdminEnterpriseAgentCert = {
  enterpriseAgentId: number;
  userId: number;
  phone: string | null;
  nickname: string | null;
  companyName: string | null;
  certLogoUrl: string | null;
  qualificationDocUrl: string | null;
  status: number;
  rejectReason: string | null;
  submittedAt: string | null;
  auditedAt: string | null;
};
