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

export type AdminTrainerHighlight = {
  id: number;
  trainerId: number;
  trainerName: string | null;
  institutionId: number | null;
  institutionName: string | null;
  ownerSubjectType: string | null;
  ownerSubjectName: string | null;
  submitterUserId: number | null;
  submitterUsername: string | null;
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

export type TrainerHighlightDetail = AdminTrainerHighlight;

export type TrainerHighlightFilters = {
  page?: number;
  limit?: number;
  trainerId?: number;
  status?: string;
};

export type TrainerHighlightsResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminTrainerHighlight[];
  };
};

export type TrainerHighlightDetailResponse = {
  code: number;
  message: string;
  data: TrainerHighlightDetail;
};

export const HIGHLIGHT_STATUS_MAP: Record<number, string> = {
  0: '待审核',
  1: '审核通过',
  2: '审核驳回'
};

export const HIGHLIGHT_STATUS_OPTIONS = [
  { value: '0', label: '待审核' },
  { value: '1', label: '审核通过' },
  { value: '2', label: '审核驳回' }
];

export const MEDIA_TYPE_MAP: Record<number, string> = {
  1: '图片',
  2: '视频'
};
