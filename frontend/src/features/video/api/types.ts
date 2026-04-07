/** 录播课模块 — 前端类型定义（对齐后端 DTO） */

export type VideoType = 'SERIES' | 'SINGLE' | 'EXTERNAL';

/** 录播课状态（对应后端 VideoStatus 枚举） */
export const VideoStatus = {
  DRAFT: 0,
  PENDING: 1,
  PUBLISHED: 2,
  REJECTED: 3,
  UNPUBLISHED: 4,
} as const;

export type VideoStatusValue = (typeof VideoStatus)[keyof typeof VideoStatus];

export const VideoStatusLabelMap: Record<VideoStatusValue, string> = {
  [VideoStatus.DRAFT]: '草稿',
  [VideoStatus.PENDING]: '待审核',
  [VideoStatus.PUBLISHED]: '已上架',
  [VideoStatus.REJECTED]: '已驳回',
  [VideoStatus.UNPUBLISHED]: '已下架',
};

export const VideoTypeLabelMap: Record<VideoType, string> = {
  SERIES: '多节视频',
  SINGLE: '单个视频',
  EXTERNAL: '外部网页视频',
};

/** 后端统一响应包装 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** 通用分页响应 */
export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

/** 分类树节点 */
export interface CategoryTreeNode {
  id: number;
  name: string;
  level: number;
  sortOrder: number;
  icon?: string;
  children?: CategoryTreeNode[];
}

/** 录播课列表项 */
export interface VideoListItem {
  id: number;
  title: string;
  videoType: VideoType;
  videoTypeLabel: string;
  coverUrl: string;
  categoryId: number;
  categoryName: string;
  teacherName: string;
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
  publisherName: string;
  keywords: string;
  publishedAt: string;
  createdAt: string;
}

/** 录播课章节 */
export interface VideoChapter {
  id: number;
  videoId: number;
  seriesId: number;
  title: string;
  description: string;
  videoUrl: string;
  coverUrl: string;
  duration: number;
  fileSize: number;
  sortOrder: number;
  isPreview: number;
  createdAt: string;
  updatedAt: string;
}

/** 录播课系列 */
export interface VideoSeries {
  id: number;
  videoId: number;
  title: string;
  description: string;
  coverUrl: string;
  sortOrder: number;
  chapterCount: number;
  createdAt: string;
  updatedAt: string;
  chapters: VideoChapter[];
}

/** 录播课详情 */
export interface VideoDetail {
  id: number;
  title: string;
  videoType: VideoType;
  videoTypeLabel: string;
  publisherId: number;
  publisherType: string;
  publisherName: string;
  categoryId: number;
  categoryName: string;
  subCategoryId: number;
  subCategoryName: string;
  coverUrl: string;
  intro: string;
  videoUrl: string;
  externalUrl: string;
  teacherName: string;
  trainerId: number;
  trainerName: string;
  price: number;
  originalPrice: number;
  isFree: number;
  keywords: string;
  duration: number;
  totalEpisodes: number;
  isFeatured: number;
  status: number;
  statusLabel: string;
  rejectReason: string;
  sortOrder: number;
  viewCount: number;
  enrollmentCount: number;
  studentCount: number;
  score: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  seriesList: VideoSeries[];
  standaloneChapters: VideoChapter[];
}

/** 创建/编辑录播课请求体 */
export interface SaveVideoRequest {
  title: string;
  videoType?: VideoType;
  categoryId?: number;
  subCategoryId?: number;
  coverUrl?: string;
  intro: string;
  videoUrl?: string;
  externalUrl?: string;
  teacherName?: string;
  trainerId?: number;
  price?: number;
  originalPrice?: number;
  isFree?: number;
  keywords?: string;
}

/** 创建/编辑系列请求体 */
export interface SaveVideoSeriesRequest {
  title: string;
  description?: string;
  coverUrl?: string;
  sortOrder?: number;
}

/** 创建/编辑章节请求体 */
export interface SaveVideoChapterRequest {
  seriesId?: number;
  title: string;
  description?: string;
  videoUrl?: string;
  coverUrl?: string;
  duration?: number;
  fileSize?: number;
  sortOrder?: number;
  isPreview?: number;
}
