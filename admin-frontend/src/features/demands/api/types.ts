export type AdminDemandListItem = {
  id: number;
  demandType: string;
  demandTypeLabel: string;
  title: string;
  trainingTopic: string;
  status: number;
  statusLabel: string;
  budgetMin: number | null;
  budgetMax: number | null;
  format: string | null;
  traineeCount: number | null;
  createdAt: string;
  userId: number;
};

export type DemandFollowUp = {
  id: number;
  demandId: number;
  operatorId: number;
  action: string;
  actionLabel: string;
  content: string | null;
  oldStatus: number | null;
  oldStatusLabel: string | null;
  newStatus: number | null;
  newStatusLabel: string | null;
  createdAt: string;
  operatorName: string | null;
};

export type AdminDemandDetail = {
  id: number;
  userId: number;
  enterpriseId: number | null;
  demandType: string;
  demandTypeLabel: string;
  title: string;
  trainingTopic: string;
  traineeCount: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  expectedStartDate: string | null;
  format: string | null;
  formatLabel: string | null;
  description: string | null;
  sourceCaseId: number | null;
  sourceCourseId: number | null;
  status: number;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
  followUps: DemandFollowUp[];
};

export type DemandFilters = {
  page?: number;
  limit?: number;
  status?: string;
  demandType?: string;
  keyword?: string;
};

export type DemandsResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminDemandListItem[];
  };
};

export type DemandDetailResponse = {
  code: number;
  message: string;
  data: AdminDemandDetail;
};

export const DEMAND_STATUS_MAP: Record<number, string> = {
  1: '已提交',
  2: '处理中',
  3: '已匹配',
  4: '已完成',
  5: '已取消'
};

export const DEMAND_STATUS_OPTIONS = [
  { value: '1', label: '已提交' },
  { value: '2', label: '处理中' },
  { value: '3', label: '已匹配' },
  { value: '4', label: '已完成' },
  { value: '5', label: '已取消' }
];

export const DEMAND_TYPE_OPTIONS = [
  { value: 'DEFAULT', label: '首页发布' },
  { value: 'TRAINING', label: '企业培训需求' },
  { value: 'CASE_CUSTOM', label: '案例定制' },
  { value: 'INTERNAL_RESERVATION', label: '内训课预约' }
];

export const FOLLOW_UP_ACTION_OPTIONS = [
  { value: 'CS_NOTE', label: '客服备注' },
  { value: 'CONTACT_RECORD', label: '沟通记录' },
  { value: 'ASSIGN_CS', label: '分派客服' }
];
