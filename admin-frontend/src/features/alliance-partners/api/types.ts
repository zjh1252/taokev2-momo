export type AlliancePartnerApplicationStatus = 1 | 2 | 3;

export type AdminAlliancePartnerApplication = {
  id: number;
  userId: number;
  partnerCode: string;
  contactName: string;
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  provinceId: number;
  cityId: number;
  legalPerson: string;
  legalIdCard: string;
  contactQq: string | null;
  agreementVersion: string;
  status: AlliancePartnerApplicationStatus;
  rejectReason: string | null;
  reviewedAt: string | null;
  reviewedBy: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AlliancePartnerApplicationFilters = {
  page?: number;
  size?: number;
  status?: string;
};

export type AlliancePartnerApplicationsResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminAlliancePartnerApplication[];
  };
};

export type AlliancePartnerApplicationDetailResponse = {
  code: number;
  message: string;
  data: AdminAlliancePartnerApplication;
};

export const ALLIANCE_PARTNER_STATUS_MAP: Record<
  AlliancePartnerApplicationStatus,
  string
> = {
  1: '待审核',
  2: '已通过',
  3: '已驳回'
};

export const ALLIANCE_PARTNER_STATUS_OPTIONS = [
  { value: '1', label: '待审核' },
  { value: '2', label: '已通过' },
  { value: '3', label: '已驳回' }
];
