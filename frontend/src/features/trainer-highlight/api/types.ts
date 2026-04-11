export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type TrainerHighlight = {
  id: number;
  trainerId: number;
  mediaType: number;
  title: string | null;
  description: string | null;
  mediaUrl: string;
  thumbnailUrl: string | null;
  duration: number | null;
  fileSize: number | null;
  sortOrder: number;
  status: number;
  rejectReason: string | null;
  viewCount: number;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SaveTrainerHighlightRequest = {
  mediaType: number;
  title?: string;
  description?: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  fileSize?: number;
  sortOrder?: number;
};

export const MediaType = {
  IMAGE: 1,
  VIDEO: 2
} as const;

export const HighlightStatus = {
  DRAFT: 0,
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3
} as const;

export const HighlightStatusLabelMap: Record<number, string> = {
  [HighlightStatus.DRAFT]: '草稿',
  [HighlightStatus.PENDING]: '待审核',
  [HighlightStatus.APPROVED]: '已通过',
  [HighlightStatus.REJECTED]: '已驳回'
};

export const MediaTypeLabelMap: Record<number, string> = {
  [MediaType.IMAGE]: '图片',
  [MediaType.VIDEO]: '视频'
};
