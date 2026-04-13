export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type TrainerCase = {
  id: number;
  trainerId: number;
  caseTitle: string;
  enterpriseName: string;
  industry: string | null;
  trainingTopic: string | null;
  trainingEffect: string | null;
  traineeCount: number | null;
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
