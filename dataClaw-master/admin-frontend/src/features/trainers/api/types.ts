export type AdminTrainer = {
  id: number;
  userId: number;
  name: string;
  avatar: string | null;
  title: string | null;
  phone: string | null;
  status: number;
  score: number;
  certLevel: number;
  isSigned: number;
  isRecommended: number;
  viewCount: number;
  approvedAt: string | null;
  createdAt: string;
};

export type AdminTrainerApplication = {
  id: number;
  userId: number;
  phone: string | null;
  nickname: string | null;
  trainerName: string | null;
  trainerTitle: string | null;
  trainerAvatar: string | null;
  status: number;
  rejectReason: string | null;
  createdAt: string;
  approvedAt: string | null;
};

export type TrainerFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
};

export type TrainersResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminTrainer[];
  };
};

export type ApplicationsResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminTrainerApplication[];
  };
};

/** 专家表状态文本映射 */
export const TRAINER_STATUS_MAP: Record<number, string> = {
  0: '草稿',
  1: '待审核',
  2: '审核通过',
  3: '审核驳回',
  4: '已禁用'
};

/** 申请状态文本映射（UserRole 表） */
export const APPLICATION_STATUS_MAP: Record<number, string> = {
  1: '已通过',
  2: '待审核',
  3: '已驳回',
  4: '已禁用'
};

export const TRAINER_STATUS_OPTIONS = [
  { value: '0', label: '草稿' },
  { value: '1', label: '待审核' },
  { value: '2', label: '审核通过' },
  { value: '3', label: '审核驳回' },
  { value: '4', label: '已禁用' }
];

export const APPLICATION_STATUS_OPTIONS = [
  { value: '2', label: '待审核' },
  { value: '1', label: '已通过' },
  { value: '3', label: '已驳回' }
];
