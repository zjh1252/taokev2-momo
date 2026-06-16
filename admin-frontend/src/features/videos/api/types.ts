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
  isFeatured: number;
  sortOrder: number;
  stickyPriority: number;
  publishedAt: string | null;
  createdAt: string;
};

/** 录播课章节（对齐 VideoChapterVO） */
export type VideoChapter = {
  id: number;
  videoId: number;
  seriesId: number | null;
  title: string;
  description: string | null;
  videoUrl: string | null;
  coverUrl: string | null;
  duration: number;
  fileSize: number | null;
  sortOrder: number;
  isPreview: number;
  createdAt: string;
  updatedAt: string;
};

/** 录播课系列（对齐 VideoSeriesVO） */
export type VideoSeries = {
  id: number;
  videoId: number;
  title: string;
  description: string | null;
  coverUrl: string | null;
  sortOrder: number;
  chapterCount: number;
  createdAt: string;
  updatedAt: string;
  chapters: VideoChapter[] | null;
};

/** 录播课详情（对齐后端 VideoDetailVO） */
export type AdminVideoDetail = {
  id: number;
  title: string;
  videoType: string;
  videoTypeLabel: string;
  publisherId: number | null;
  publisherType: string | null;
  publisherName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  subCategoryId: number | null;
  subCategoryName: string | null;
  coverUrl: string | null;
  intro: string | null;
  videoUrl: string | null;
  externalUrl: string | null;
  teacherName: string | null;
  trainerId: number | null;
  trainerName: string | null;
  price: number | null;
  originalPrice: number | null;
  isFree: number;
  keywords: string | null;
  duration: number;
  totalEpisodes: number;
  isFeatured: number;
  status: number;
  statusLabel: string;
  rejectReason: string | null;
  sortOrder: number;
  viewCount: number;
  enrollmentCount: number;
  studentCount: number;
  score: number | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  seriesList: VideoSeries[] | null;
  standaloneChapters: VideoChapter[] | null;
};

export type VideoDetailResponse = {
  code: number;
  message: string;
  data: AdminVideoDetail;
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
  SERIES: '系列课程',
  SINGLE: '单门课程',
  EXTERNAL: '外部网页视频'
};

/** 置顶优先级 → 文本 */
export const STICKY_PRIORITY_MAP: Record<number, string> = {
  0: '不限',
  1: '列表推荐',
  2: '列表置顶'
};

/** 置顶优先级下拉选项 */
export const STICKY_PRIORITY_OPTIONS = [
  { value: 0, label: '不限' },
  { value: 1, label: '列表推荐' },
  { value: 2, label: '列表置顶' }
];

export type SaveVideoPayload = {
  title: string;
  videoType: string;
  categoryId: number;
  subCategoryId?: number;
  coverUrl?: string;
  videoUrl?: string;
  externalUrl?: string;
  intro?: string;
  publisherType: string;
  publisherId: number;
  trainerId?: number;
  teacherName?: string;
  duration?: number;
  price?: number;
  companyPrice?: number;
  maxPurchaseQty?: number;
  isFree?: number;
  keywords?: string;
  draft?: boolean;
  directPublish?: boolean;
};
