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
  /** 当前用户是否已购买解锁 */
  unlocked?: boolean;
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
  materialUrl?: string | null;
  materialText?: string | null;
  videoUrl: string;
  externalUrl: string;
  teacherName: string;
  trainerId: number;
  trainerName: string;
  /** 专家头像（trainerId > 0 时有值） */
  trainerAvatar?: string;
  price: number;
  originalPrice: number;
  isFree: number;
  keywords: string;
  companyPrice?: number;
  maxPurchaseQty?: number;
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
  favoriteCount: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  seriesList: VideoSeries[];
  standaloneChapters: VideoChapter[];
  /** 是否展示「系列介绍」Tab（属于视频包且包内有多门课） */
  hasSeriesPackage?: boolean;
}

/** 录播课评论 */
export interface VideoComment {
  id: number;
  videoId: number;
  userName: string;
  content: string;
  rating: number;
  createdAt: string;
}

export interface SubmitVideoCommentPayload {
  rating: number;
  content: string;
}

/** 系列介绍 — 视频包内单条录播课 */
export interface VideoSeriesItem {
  id: number;
  title: string;
  coverUrl: string;
  price: number;
  teacherName: string;
  studentCount: number;
}

/** 系列介绍 — 视频包及包内录播课 */
export interface VideoSeriesPackage {
  packageName: string;
  videos: VideoSeriesItem[];
}

/** 录播课购买选项 */
export interface VideoPurchaseOptions {
  hasSeriesOption: boolean;
  singlePrice: number;
  singleCompanyPrice: number;
  singleMaxQuantity: number;
  singleQuantityUnlimited?: boolean;
  seriesProductId?: number;
  seriesPackageName?: string;
  seriesVideoCount?: number;
  seriesPrice?: number;
  seriesCompanyPrice?: number;
  seriesMaxQuantity?: number;
  seriesQuantityUnlimited?: boolean;
}

/** 录播课访问权限信息 */
export interface VideoAccessInfo {
  accessible: boolean;
  enrolled: boolean;
  isFree: boolean;
  isOwner: boolean;
}

/** 第三方章节播放签发结果 */
export interface VideoChapterPlaybackUrl {
  embedUrl: string;
  provider: 'eceibs' | 'kuaike' | 'kuanxue' | 'scho' | string;
  /** embed=iframe；direct=Video.js 直链 */
  playbackMode?: 'embed' | 'direct';
}

/** 章节学习进度 */
export interface ChapterProgressItem {
  chapterId: number;
  watchDuration: number;
  chapterDuration: number;
  progress: number;
  completed: boolean;
  lastWatchedAt: string | null;
}

/** 录播课学习进度 */
export interface VideoProgressInfo {
  overallProgress: number;
  lastChapterId: number;
  totalWatchTime: number;
  lastWatchedAt: string | null;
  chapters: ChapterProgressItem[];
}

/** 创建/编辑录播课请求体 */
export interface SaveVideoRequest {
  title: string;
  /** true=保存草稿（仅校验标题），false/不传=提交审核 */
  draft?: boolean;
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
  companyPrice?: number;
  maxPurchaseQty?: number;
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
