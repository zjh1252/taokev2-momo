export type AdminTrainerCase = {
  id: number;
  trainerId: number;
  trainerName: string | null;
  caseTitle: string;
  enterpriseName: string;
  industry: string | null;
  trainingTopic: string | null;
  coverImage: string | null;
  sortOrder: number;
  status: number;
  rejectReason: string | null;
  trainingDate: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TrainerCaseDetail = {
  id: number;
  trainerId: number;
  trainerUserId: number | null;
  trainerName: string | null;
  caseTitle: string;
  enterpriseName: string;
  industry: string | null;
  trainingTopic: string | null;
  trainingEffect: string | null;
  traineeCount: number | null;
  /** 培训地点 - 省 ID */
  provinceId: number | null;
  /** 培训地点 - 市 ID */
  cityId: number | null;
  /** 培训地点 - 区/县 ID */
  districtId: number | null;
  /** 培训地点 - 镇/街道 ID */
  townId: number | null;
  /** 培训地点 - 详细地址 */
  trainingAddress: string | null;
  trainingDate: string | null;
  description: string | null;
  coverImage: string | null;
  autoExtracted: boolean;
  sortOrder: number;
  status: number;
  rejectReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  files: TrainerCaseFile[];
};

export type TrainerCaseFile = {
  id: number;
  caseId: number;
  /** 文件类型：1=图片, 2=视频 */
  fileType: number;
  title: string | null;
  description: string | null;
  fileUrl: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  fileSize: number | null;
  autoExtracted: boolean | null;
  sortOrder: number;
  status: number | null;
  rejectReason: string | null;
  viewCount: number | null;
  createdAt: string;
};

export type TrainerCaseFilters = {
  page?: number;
  limit?: number;
  trainerId?: number;
  status?: string;
};

export type TrainerCasesResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminTrainerCase[];
  };
};

export type TrainerCaseDetailResponse = {
  code: number;
  message: string;
  data: TrainerCaseDetail;
};

export const CASE_STATUS_MAP: Record<number, string> = {
  0: '待审核',
  1: '审核通过',
  2: '审核驳回'
};

export const CASE_STATUS_OPTIONS = [
  { value: '0', label: '待审核' },
  { value: '1', label: '审核通过' },
  { value: '2', label: '审核驳回' }
];

export type SaveTrainerCasePayload = {
  caseTitle: string;
  enterpriseName: string;
  industry?: string;
  trainingTopic?: string;
  trainingEffect?: string;
  traineeCount?: number;
  provinceId: number;
  cityId: number;
  districtId: number;
  townId?: number;
  trainingAddress?: string;
  trainingDate?: string;
  description?: string;
  coverImage?: string;
};
