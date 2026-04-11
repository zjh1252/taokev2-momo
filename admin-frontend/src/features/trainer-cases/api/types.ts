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
  0: '草稿',
  1: '待审核',
  2: '审核通过',
  3: '审核驳回'
};

export const CASE_STATUS_OPTIONS = [
  { value: '0', label: '草稿' },
  { value: '1', label: '待审核' },
  { value: '2', label: '审核通过' },
  { value: '3', label: '审核驳回' }
];
