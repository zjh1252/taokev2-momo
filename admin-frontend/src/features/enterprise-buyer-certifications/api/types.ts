export type RoleCertFilters = {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
};

export type RoleCertPageResponse<T> = {
  code: number;
  message: string;
  data: {
    list: T[];
    total: number;
    page: number;
    size: number;
  };
};

export const ROLE_CERT_STATUS_MAP: Record<number, string> = {
  1: '待审核',
  2: '已通过',
  3: '已驳回'
};

export const ROLE_CERT_STATUS_OPTIONS = [
  { label: '待审核', value: '1' },
  { label: '已通过', value: '2' },
  { label: '已驳回', value: '3' }
];

export type AdminBuyerRealNameCert = {
  buyerId: number;
  userId: number;
  phone: string | null;
  nickname: string | null;
  companyName: string | null;
  realName: string | null;
  idCardNo: string | null;
  idCardFront: string | null;
  idCardBack: string | null;
  status: number;
  rejectReason: string | null;
  submittedAt: string | null;
  auditedAt: string | null;
};

export type AdminBuyerWorkCert = {
  id: number;
  buyerId: number;
  userId: number;
  phone: string | null;
  nickname: string | null;
  companyName: string | null;
  contactName: string | null;
  workCompanyName: string | null;
  position: string | null;
  startDate: string | null;
  endDate: string | null;
  jobDescription: string | null;
  proofFile: string | null;
  status: number;
  rejectReason: string | null;
  submittedAt: string | null;
  auditedAt: string | null;
};
