export type AllianceLecturer721ApplicationStatus = 1 | 2 | 3;

export type AdminAllianceLecturer721Application = {
  id: number;
  userId: number;
  applicationCode: string;
  lecturerName: string;
  idCardNo: string;
  coopYears: number;
  dailyFee: number;
  address: string;
  phone: string;
  wechat: string;
  email: string;
  bankName: string;
  bankAccount: string;
  signatureUrl: string;
  agreementVersion: string;
  status: AllianceLecturer721ApplicationStatus;
  rejectReason: string | null;
  reviewedAt: string | null;
  reviewedBy: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AllianceLecturer721ApplicationFilters = {
  page?: number;
  size?: number;
  status?: string;
};

export type AllianceLecturer721ApplicationsResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminAllianceLecturer721Application[];
  };
};

export type AllianceLecturer721ApplicationDetailResponse = {
  code: number;
  message: string;
  data: AdminAllianceLecturer721Application;
};

export const ALLIANCE_LECTURER721_STATUS_MAP: Record<
  AllianceLecturer721ApplicationStatus,
  string
> = {
  1: '待审核',
  2: '已通过',
  3: '已驳回'
};

export const ALLIANCE_LECTURER721_STATUS_OPTIONS = [
  { value: '1', label: '待审核' },
  { value: '2', label: '已通过' },
  { value: '3', label: '已驳回' }
];
