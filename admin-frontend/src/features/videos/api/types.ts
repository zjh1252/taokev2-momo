/** 后台录播课列表项（对齐 VideoListItemVO） */
export type AdminVideo = {
  id: number;
  title: string;
  videoType: string;
  videoTypeLabel: string;
  coverUrl: string | null;
  categoryId: number;
  categoryName: string | null;
  teacherName: string | null;
  price: number;
  originalPrice: number;
  isFree: number;
  duration: number;
  totalEpisodes: number;
  status: number;
  statusLabel: string;
  viewCount: number;
  enrollmentCount: number;
  studentCount: number;
  score: number;
  publisherType: string;
  publisherName: string | null;
  keywords: string | null;
  publishedAt: string | null;
  createdAt: string;
};

export type VideoFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
};

export type VideosResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminVideo[];
  };
};

/** 录播课状态值 → 文本 */
export const VIDEO_STATUS_MAP: Record<number, string> = {
  0: '草稿',
  1: '待审核',
  2: '已上架',
  3: '驳回',
  4: '已下架'
};

export const VIDEO_STATUS_OPTIONS = [
  { value: '0', label: '草稿' },
  { value: '1', label: '待审核' },
  { value: '2', label: '已上架' },
  { value: '3', label: '驳回' },
  { value: '4', label: '已下架' }
];

export const VIDEO_TYPE_MAP: Record<string, string> = {
  SERIES: '多节视频',
  SINGLE: '单个视频',
  EXTERNAL: '外部网页视频'
};
