/** 后端 ApiResponse 通用包装 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** 分页数据结构（与后端 PageResponse 字段对齐） */
export interface PageData<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

/** 互动状态 */
export interface InteractionState {
  targetType: string;
  targetId: number;
  favorited: boolean;
  liked: boolean;
  favoriteCount: number;
  likeCount: number;
}

/** 收藏列表项 */
export interface FavoriteItem {
  id: number;
  targetType: string;
  targetId: number;
  title: string;
  subtitle: string;
  coverUrl: string;
  createdAt: string;
}

/** 评价 VO */
export interface ReviewItem {
  id: number;
  reviewScope: string;
  courseId: number | null;
  trainerUserId: number | null;
  expertName: string;
  trainingDate: string | null;
  courseDays: number | null;
  courseTitle: string;
  clientCompany: string;
  trainingLocation: string;
  ratingContent: number;
  ratingTeaching: number;
  ratingService: number;
  avgScore: number;
  commentText: string;
  photoUrls: string[];
  submitterName: string;
  isAnonymous: number;
  status: number;
  createdAt: string;
}

/** 提交评价请求 */
export interface SubmitReviewPayload {
  reviewScope: 'COURSE' | 'TRAINER';
  courseId?: number;
  trainerUserId?: number;
  expertName?: string;
  trainingDate?: string;
  courseDays?: number;
  courseTitle?: string;
  clientCompany?: string;
  trainingLocation?: string;
  ratingContent: number;
  ratingTeaching: number;
  ratingService: number;
  commentText: string;
  photoUrls?: string[];
  submitterName?: string;
  submitterContact?: string;
  anonymous?: boolean;
}

/** 提交专家留言请求 */
export interface SubmitTrainerMessagePayload {
  trainerUserId: number;
  trainingTopic: string;
  trainingGoal?: string;
  contactName: string;
  contactMobile: string;
  companyName: string;
  companyPhone?: string;
  provinceId?: number;
  cityId?: number;
  trainingDays?: string;
  email?: string;
  remark?: string;
}
