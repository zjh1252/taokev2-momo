export type AllianceAmbassadorApplicationStatus = 1 | 2 | 3;

export type AdminAllianceAmbassadorApplication = {
  id: number;
  userId: number;
  ambassadorCode: string;
  agreementVersion: string;
  status: AllianceAmbassadorApplicationStatus;
  rejectReason: string | null;
  reviewedAt: string | null;
  reviewedBy: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AllianceAmbassadorApplicationFilters = {
  page?: number;
  size?: number;
  status?: string;
};

export type AllianceAmbassadorApplicationsResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminAllianceAmbassadorApplication[];
  };
};

export type AllianceAmbassadorApplicationDetailResponse = {
  code: number;
  message: string;
  data: AdminAllianceAmbassadorApplication;
};

export const ALLIANCE_AMBASSADOR_STATUS_MAP: Record<
  AllianceAmbassadorApplicationStatus,
  string
> = {
  1: '待审核',
  2: '已通过',
  3: '已驳回'
};

export const ALLIANCE_AMBASSADOR_STATUS_OPTIONS = [
  { value: '1', label: '待审核' },
  { value: '2', label: '已通过' },
  { value: '3', label: '已驳回' }
];
