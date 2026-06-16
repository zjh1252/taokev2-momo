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

export type AdminTrainerDetail = AdminTrainer & {
  email?: string | null;
  trainerCode?: string | null;
  teachingName?: string | null;
  gender?: number | null;
  intro?: string | null;
  expertiseTags?: string | null;
  nickname?: string | null;
  realNameCertStatus?: number | null;
  professionalCertStatus?: number | null;
  courseCount?: number | null;
  caseCount?: number | null;
  videoCount?: number | null;
  bookCount?: number | null;
  reviewCount?: number | null;
  agentBindingCount?: number | null;
  institutionBindingCount?: number | null;
  roles?: { role: string; status: number }[];
};

export type TrainerDetailResponse = {
  code: number;
  message: string;
  data: AdminTrainerDetail;
};

export type AdminTrainerApplication = {
  id: number;
  userId: number;
  trainerId: number | null;
  phone: string | null;
  nickname: string | null;
  trainerName: string | null;
  trainerTitle: string | null;
  trainerAvatar: string | null;
  status: number;
  reapplying: boolean | null;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string | null;
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

export const TRAINER_STATUS_MAP: Record<number, string> = {
  0: '草稿',
  1: '待审核',
  2: '审核通过',
  3: '审核驳回',
  4: '已禁用'
};

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

export const REAL_NAME_CERT_STATUS_MAP: Record<number, string> = {
  1: '待审核',
  2: '已通过',
  3: '已驳回'
};
