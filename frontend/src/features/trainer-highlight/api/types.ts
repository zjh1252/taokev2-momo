export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type TrainerHighlightFile = {
  id: number;
  highlightId: number;
  fileType: number;
  title: string | null;
  fileUrl: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  fileSize: number | null;
  sortOrder: number;
  createdAt: string;
};

export type TrainerHighlight = {
  id: number;
  trainerId: number;
  /** 专家所属 user_id（仅自服务详情/列表返回，用于代管编辑场景的归属展示） */
  trainerUserId?: number;
  /** 专家昵称（同上） */
  trainerName?: string;
  title: string | null;
  description: string | null;
  coverImage: string | null;
  sortOrder: number;
  status: number;
  rejectReason: string | null;
  viewCount: number;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  files: TrainerHighlightFile[];
};

export type SaveTrainerHighlightRequest = {
  title?: string;
  description?: string;
  coverImage?: string;
  sortOrder?: number;
};

export type SaveTrainerHighlightFileRequest = {
  fileType: number;
  title?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  fileSize?: number;
  sortOrder?: number;
};

export const MediaType = {
  IMAGE: 1,
  VIDEO: 2
} as const;

export const HighlightStatus = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
  DRAFT: 3
} as const;

export const HighlightStatusLabelMap: Record<number, string> = {
  [HighlightStatus.PENDING]: '待审核',
  [HighlightStatus.APPROVED]: '已通过',
  [HighlightStatus.REJECTED]: '已驳回',
  [HighlightStatus.DRAFT]: '草稿'
};

export const MediaTypeLabelMap: Record<number, string> = {
  [MediaType.IMAGE]: '图片',
  [MediaType.VIDEO]: '视频'
};
