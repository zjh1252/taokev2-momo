export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

/** 专家自服务著作（对应后端 TrainerBookResponse） */
export type TrainerBook = {
  id: number;
  trainerId: number;
  submitterUserId?: number;
  title: string;
  authorName?: string;
  coverUrl?: string;
  publisher?: string;
  publishDate?: string;
  description?: string;
  buyUrl?: string;
  sortOrder: number;
  status: number;
  rejectReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type SaveTrainerBookRequest = {
  title: string;
  authorName?: string;
  coverUrl?: string;
  publisher?: string;
  publishDate?: string;
  description?: string;
  buyUrl?: string;
  sortOrder?: number;
};

export const BookStatus = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
} as const;

export const BookStatusLabelMap: Record<number, string> = {
  [BookStatus.PENDING]: '待审核',
  [BookStatus.APPROVED]: '已通过',
  [BookStatus.REJECTED]: '已驳回',
};
