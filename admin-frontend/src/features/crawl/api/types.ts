/** 爬取专家列表项（对齐 CrawledTrainerVO） */
export type CrawledTrainer = {
  id: number;
  source: string;
  sourceUrl: string;
  name: string | null;
  title: string | null;
  avatar: string | null;
  expertiseTags: string | null;
  teachingStyle: string | null;
  experienceYears: number | null;
  dedupStatus: number;
  dedupStatusText: string;
  dedupTargetType: string | null;
  dedupTargetId: number | null;
  dedupTargetFrontendUrl: string | null;
  dedupMatchType: string | null;
  dedupScore: number | null;
  dedupCheckedAt: string | null;
  dedupReason: string | null;
  reviewStatus: number;
  reviewStatusText: string;
  createdAt: string;
};

/** 爬取专家详情（对齐 CrawledTrainerDetailVO） */
export type CrawledTrainerDetail = {
  id: number;
  source: string;
  sourceUrl: string;
  sourceTrainerId: string | null;
  name: string | null;
  teachingName: string | null;
  avatar: string | null;
  title: string | null;
  gender: number;
  oneLineIntro: string | null;
  bio: string | null;
  intro: string | null;
  background: string | null;
  goodAt: string | null;
  specialties: string | null;
  expertiseTags: string | null;
  teachingStyle: string | null;
  experienceYears: number | null;
  teachingYears: number | null;
  provinceId: number;
  cityId: number;
  partialClients: string | null;
  educationList: EducationItem[] | null;
  experienceList: ExperienceItem[] | null;
  honorsList: HonorItem[] | null;
  booksList: BookItem[] | null;
  coursesList: CourseItem[] | null;
  casesList: CaseItem[] | null;
  dedupStatus: number;
  dedupStatusText: string;
  dedupTrainerId: number | null;
  dedupReason: string | null;
  reviewStatus: number;
  reviewStatusText: string;
  reviewRejectReason: string | null;
  reviewedAt: string | null;
  importedTrainerId: number | null;
  createdAt: string;
  rawJson: Record<string, unknown> | null;
};

export type EducationItem = {
  school: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
};

export type ExperienceItem = {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type HonorItem = {
  name: string;
  authority: string;
  date: string;
  description: string;
};

export type BookItem = {
  title: string;
  publisher: string;
  publishDate: string;
  description: string;
};

export type CourseItem = {
  title: string;
  type: string;
  category: string;
  summary: string;
  coverUrl?: string;
  sourceUrl?: string;
};

export type CaseItem = {
  title: string;
  client: string;
  description: string;
};

/** 爬取课程列表项（对齐 CrawledCourseVO） */
export type CrawledCourse = {
  id: number;
  source: string;
  sourceUrl: string;
  title: string;
  type: string;
  typeLabel: string | null;
  categoryId: number;
  subCategoryId: number;
  categoryName: string | null;
  subCategoryName: string | null;
  categoryNameRaw: string | null;
  coverUrl: string | null;
  price: number;
  priceRaw: string | null;
  priceParseStatus: string | null;
  contentType: string | null;
  durationDays: number;
  trainerNameRaw: string | null;
  dedupStatus: number;
  dedupStatusText: string;
  dedupTargetType: string | null;
  dedupTargetId: number | null;
  dedupTargetFrontendUrl: string | null;
  dedupMatchType: string | null;
  dedupScore: number | null;
  dedupCheckedAt: string | null;
  dedupReason: string | null;
  reviewStatus: number;
  reviewStatusText: string;
  reviewRejectReason: string | null;
  reviewedAt: string | null;
  importedCourseId: number | null;
  createdAt: string;
};

/** 爬取课程详情（对齐 CrawledCourseDetailVO） */
export type CrawledCourseDetail = {
  id: number;
  source: string;
  sourceUrl: string;
  sourceCourseId: string | null;
  title: string;
  type: string;
  typeLabel: string | null;
  categoryId: number;
  subCategoryId: number;
  categoryName: string | null;
  subCategoryName: string | null;
  categoryNameRaw: string | null;
  coverUrl: string | null;
  intro: string | null;
  summary: string | null;
  syllabus: string | null;
  syllabusPlainText: string | null;
  syllabusHtml: string | null;
  syllabusContentType: CourseContentType | null;
  syllabusImages: CourseImageItem[] | null;
  sitePhotosPlainText: string | null;
  sitePhotosHtml: string | null;
  sitePhotosContentType: CourseContentType | null;
  sitePhotosImages: CourseImageItem[] | null;
  honorCertificatesPlainText: string | null;
  honorCertificatesHtml: string | null;
  honorCertificatesContentType: CourseContentType | null;
  honorCertificatesImages: CourseImageItem[] | null;
  audience: string | null;
  highlights: string | null;
  durationDays: number;
  totalHours: number;
  price: number;
  priceRaw: string | null;
  priceParseStatus: string | null;
  contentType: string | null;
  originalPrice: number;
  keywords: string | null;
  trainerNameRaw: string | null;
  plansList: PlanItem[] | null;
  targetAudience: string | null;
  learningOutcomes: string | null;
  dedupStatus: number;
  dedupStatusText: string;
  dedupCourseId: number | null;
  dedupTargetType: string | null;
  dedupTargetId: number | null;
  dedupMatchType: string | null;
  dedupScore: number | null;
  dedupCheckedAt: string | null;
  dedupReason: string | null;
  reviewStatus: number;
  reviewStatusText: string;
  reviewRejectReason: string | null;
  reviewedAt: string | null;
  importedCourseId: number | null;
  createdAt: string;
  servicesList: MediaAsset[] | null;
  diagnostics: CrawlDiagnostic[] | null;
  rawJson: Record<string, unknown> | null;
};

export type CourseContentType = 'TEXT' | 'IMAGE' | 'MIXED';

export type CourseImageItem = {
  type?: string;
  url?: string;
  label?: string;
};

export type CrawlDiagnostic = {
  field?: string;
  reason?: string;
  raw?: string;
  message?: string;
};

export type PlanItem = {
  startTime: string;
  endTime: string;
  startDate?: string;
  provinceId?: number;
  cityId?: number;
  districtId?: number;
  city: string;
  address: string;
  onlineUrl?: string;
  status?: string;
};

export type MediaAsset = {
  type?: string;
  url?: string;
  label?: string;
};

export type CrawledCourseEditPayload = {
  categoryId?: number;
  subCategoryId?: number;
  trainerId?: number;
  title?: string;
  type?: string;
  categoryNameRaw?: string;
  coverUrl?: string;
  intro?: string;
  summary?: string;
  syllabus?: string;
  audience?: string;
  highlights?: string;
  durationDays?: number;
  totalHours?: number;
  price?: number;
  originalPrice?: number;
  keywords?: string;
  trainerNameRaw?: string;
  targetAudience?: string;
  learningOutcomes?: string;
  plansJson?: Record<string, unknown>[];
  forceImport?: boolean;
};

/** 爬虫任务（对齐 CrawlJobVO） */
export type CrawlJob = {
  id: number;
  source: string;
  dataType: string;
  status: number;
  statusLabel: string;
  crawlerJobId: string | null;
  totalCount: number;
  processedCount: number;
  successCount: number;
  duplicateCount: number;
  errorCount: number;
  errorMessage: string | null;
  progressMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  triggeredBy: number;
  triggeredByName: string | null;
  createdAt: string;
};

/** 数据源信息 */
export type CrawlSource = {
  id?: number;
  code: string;
  name: string;
  url: string;
  dataType: string;
  status: string;
  enabled?: boolean;
  builtIn?: boolean;
  sortOrder?: number;
  remark?: string | null;
};

export type SaveCrawlSourcePayload = {
  code: string;
  name: string;
  url: string;
  dataType: string;
  enabled?: boolean;
  sortOrder?: number;
  remark?: string;
};

export type CrawlSourceResponse = {
  code: number;
  message: string;
  data: CrawlSource;
};

// ==================== 查询参数 ====================

export type CrawledTrainerFilters = {
  page?: number;
  size?: number;
  source?: string;
  reviewStatus?: string;
  dedupStatus?: string;
  keyword?: string;
};

export type CrawledCourseFilters = {
  page?: number;
  size?: number;
  source?: string;
  reviewStatus?: string;
  dedupStatus?: string;
  keyword?: string;
};

export type CrawlJobFilters = {
  page?: number;
  size?: number;
  source?: string;
  dataType?: string;
  status?: string;
};

// ==================== 响应类型 ====================

export type CrawledTrainersResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: CrawledTrainer[];
  };
};

export type CrawledTrainerDetailResponse = {
  code: number;
  message: string;
  data: CrawledTrainerDetail;
};

export type CrawledCoursesResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: CrawledCourse[];
  };
};

export type CrawledCourseDetailResponse = {
  code: number;
  message: string;
  data: CrawledCourseDetail;
};

export type CrawlJobsResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: CrawlJob[];
  };
};

export type CrawlSourcesResponse = {
  code: number;
  message: string;
  data: CrawlSource[];
};

export type TriggerCrawlResponse = {
  code: number;
  message: string;
  data: CrawlJob;
};

// ==================== 常量 ====================

/** 去重状态 */
export const DEDUP_STATUS_MAP: Record<number, string> = {
  0: '未检查',
  1: '无重复',
  2: '疑似重复',
  3: '确认重复'
};

/** 审核状态 */
export const REVIEW_STATUS_MAP: Record<number, string> = {
  0: '待审核',
  1: '已通过',
  2: '已驳回',
  3: '已入库'
};

/** 任务状态 */
export const JOB_STATUS_MAP: Record<number, string> = {
  0: '待执行',
  1: '运行中',
  2: '已完成',
  3: '失败',
  4: '已取消'
};

export const DEDUP_STATUS_OPTIONS = [
  { value: '0', label: '未检查' },
  { value: '1', label: '无重复' },
  { value: '2', label: '疑似重复' },
  { value: '3', label: '确认重复' }
];

export const REVIEW_STATUS_OPTIONS = [
  { value: '0', label: '待审核' },
  { value: '1', label: '已通过' },
  { value: '2', label: '已驳回' },
  { value: '3', label: '已入库' }
];

export const JOB_STATUS_OPTIONS = [
  { value: '0', label: '待执行' },
  { value: '1', label: '运行中' },
  { value: '2', label: '已完成' },
  { value: '3', label: '失败' },
  { value: '4', label: '已取消' }
];

export const DATA_TYPE_OPTIONS = [
  { value: 'TRAINER', label: '专家' },
  { value: 'COURSE', label: '课程' }
];
