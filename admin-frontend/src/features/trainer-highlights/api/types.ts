export type AdminTrainerHighlight = {
  id: number;
  trainerId: number;
  trainerName: string | null;
  mediaType: number;
  title: string | null;
  mediaUrl: string;
  thumbnailUrl: string | null;
  sortOrder: number;
  status: number;
  rejectReason: string | null;
  viewCount: number;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TrainerHighlightDetail = {
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
  0: '草稿',
  1: '待审核',
  2: '审核通过',
  3: '审核驳回'
};

export const HIGHLIGHT_STATUS_OPTIONS = [
  { value: '0', label: '草稿' },
  { value: '1', label: '待审核' },
  { value: '2', label: '审核通过' },
  { value: '3', label: '审核驳回' }
];

export const MEDIA_TYPE_MAP: Record<number, string> = {
  1: '图片',
  2: '视频'
};
