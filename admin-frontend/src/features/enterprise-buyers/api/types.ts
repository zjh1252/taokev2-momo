export type AdminEnterpriseBuyer = {
  id: number;
  userId: number;
  companyName: string | null;
  industry: string | null;
  companySize: string | null;
  contactName: string | null;
  contactPhone: string | null;
  createdAt: string;
};

export type AdminEnterpriseBuyerApplication = {
  id: number;
  userId: number;
  phone: string | null;
  nickname: string | null;
  companyName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  status: number;
  rejectReason: string | null;
  createdAt: string;
  approvedAt: string | null;
};

export type EnterpriseBuyerFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
};

export type EnterpriseBuyersResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminEnterpriseBuyer[];
  };
};

export type EnterpriseBuyerApplicationsResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminEnterpriseBuyerApplication[];
  };
};

/** 申请状态文本映射（UserRole 表） */
export const APPLICATION_STATUS_MAP: Record<number, string> = {
  1: '已通过',
  2: '待审核',
  3: '已驳回',
  4: '已禁用'
};

export const APPLICATION_STATUS_OPTIONS = [
  { value: '2', label: '待审核' },
  { value: '1', label: '已通过' },
  { value: '3', label: '已驳回' }
];
