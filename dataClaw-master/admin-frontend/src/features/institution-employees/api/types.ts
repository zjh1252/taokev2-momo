export type AdminInstitutionEmployee = {
  id: number;
  userId: number;
  orgId: number | null;
  orgName: string | null;
  position: string | null;
  department: string | null;
  createdAt: string;
};

export type AdminInstitutionEmployeeApplication = {
  id: number;
  userId: number;
  phone: string | null;
  nickname: string | null;
  position: string | null;
  department: string | null;
  orgName: string | null;
  status: number;
  rejectReason: string | null;
  createdAt: string;
  approvedAt: string | null;
};

export type InstitutionEmployeeFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
};

export type InstitutionEmployeesResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminInstitutionEmployee[];
  };
};

export type InstitutionEmployeeApplicationsResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminInstitutionEmployeeApplication[];
  };
};

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
