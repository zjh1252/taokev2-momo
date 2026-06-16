export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type TrainerCase = {
  id: number;
  trainerId: number;
  /** 专家所属 user_id（自服务详情返回，用于代管编辑场景的归属展示） */
  trainerUserId?: number;
  /** 专家昵称（同上） */
  trainerName?: string;
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
  /** 培训地点 - 镇/街道 ID（选填） */
  townId: number | null;
  /** 培训地点 - 详细地址 */
  trainingAddress: string | null;
  trainingDate: string | null;
  description: string | null;
  coverImage: string | null;
  /** 案例详情页访问次数 */
  viewCount?: number;
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
  fileType: number;
  title: string | null;
  description: string | null;
  fileUrl: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  fileSize: number | null;
  sortOrder: number;
  createdAt: string;
};

export type SaveTrainerCaseRequest = {
  caseTitle: string;
  enterpriseName: string;
  industry?: string;
  trainingTopic?: string;
  trainingEffect?: string;
  traineeCount?: number;
  /** 培训地点 - 省 ID（必填） */
  provinceId: number;
  /** 培训地点 - 市 ID（必填） */
  cityId: number;
  /** 培训地点 - 区/县 ID（必填） */
  districtId: number;
  /** 培训地点 - 镇/街道 ID（选填） */
  townId?: number;
  /** 培训地点 - 详细地址（选填） */
  trainingAddress?: string;
  trainingDate?: string;
  description?: string;
  coverImage?: string;
  sortOrder?: number;
};

export const CaseStatus = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2
} as const;

export const CaseStatusLabelMap: Record<number, string> = {
  [CaseStatus.PENDING]: '待审核',
  [CaseStatus.APPROVED]: '已通过',
  [CaseStatus.REJECTED]: '已驳回'
};
