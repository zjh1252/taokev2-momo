/** 录播课学习项 */
export interface MyVideoLearning {
  videoId: number;
  title: string;
  coverUrl: string;
  teacherName: string;
  totalEpisodes: number;
  completedChapters: number;
  /** 0~100 */
  progress: number;
  completed: boolean;
  lastChapterId: number;
  enrolledAt: string;
  expiredAt: string | null;
  lastWatchedAt: string;
  pricePaid: number;
}

/** 公开课报名项 */
export interface MyCourseEnrollment {
  courseId: number;
  title: string;
  coverUrl: string;
  /** OPEN_OFFLINE / OPEN_ONLINE */
  type: string;
  typeLabel: string;
  trainerName: string | null;
  pricePaid: number;
  enrolledAt: string;
  expiredAt: string | null;
  /** 1=有效 0=已取消 */
  status: number;
  planStartTime: string | null;
  planEndTime: string | null;
  planCity: string | null;
  planAddress: string | null;
}

/** 继续学习（在 MyVideoLearning 基础上追加章节标题） */
export interface ContinueLearning extends MyVideoLearning {
  lastChapterTitle: string;
}

/** 通用分页响应 */
export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

/** 通用 API 响应 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
