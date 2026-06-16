export type AdminAgent = {
  id: number;
  userId: number;
  bio: string | null;
  specialties: string | null;
  serviceCityIds: string | null;
  createdAt: string;
};

export type AdminAgentApplication = {
  id: number;
  userId: number;
  phone: string | null;
  nickname: string | null;
  bio: string | null;
  specialties: string | null;
  status: number;
  rejectReason: string | null;
  createdAt: string;
  approvedAt: string | null;
};

export type AgentFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
};

export type AgentsResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminAgent[];
  };
};

export type AgentApplicationsResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminAgentApplication[];
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
