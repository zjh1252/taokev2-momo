export type AdminTrainingReview = {
  id: number;
  reviewScope: string;
  courseId: number | null;
  trainerUserId: number | null;
  institutionId: number | null;
  expertName: string | null;
  trainingDate: string | null;
  courseDays: string | null;
  courseTitle: string | null;
  clientCompany: string | null;
  trainingLocation: string | null;
  ratingContent: number;
  ratingTeaching: number;
  ratingService: number;
  avgScore: string | number;
  commentText: string;
  photoUrls: string[];
  submitterName: string | null;
  anonymous: boolean;
  status: number;
  createdAt: string;
  userId: number;
  rejectReason: string | null;
  submitterContact: string | null;
};

export type TrainingReviewFilters = {
  page?: number;
  limit?: number;
  status?: string;
  reviewScope?: string;
};

export type TrainingReviewsResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminTrainingReview[];
  };
};

/** 与后端 ReviewStatus 一致 */
export const REVIEW_STATUS_MAP: Record<number, string> = {
  [-1]: '已驳回',
  0: '待审核',
  1: '已通过',
  2: '已隐藏'
};

export const REVIEW_STATUS_OPTIONS = [
  { value: '0', label: '待审核' },
  { value: '1', label: '已通过' },
  { value: '-1', label: '已驳回' },
  { value: '2', label: '已隐藏' }
];

export const REVIEW_SCOPE_MAP: Record<string, string> = {
  COURSE: '课程',
  TRAINER: '专家',
  INSTITUTION: '机构'
};

export const REVIEW_SCOPE_OPTIONS = [
  { value: 'COURSE', label: '课程' },
  { value: 'TRAINER', label: '专家' },
  { value: 'INSTITUTION', label: '机构' }
];
