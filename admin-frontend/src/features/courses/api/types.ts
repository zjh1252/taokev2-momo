/** 后台课程列表项（对齐 AdminCourseVO） */
export type AdminCourse = {
  id: number;
  title: string;
  type: string;
  typeLabel: string;
  coverUrl: string | null;
  publisherId: number;
  publisherType: string;
  categoryId: number;
  categoryName: string | null;
  durationDays: number;
  price: number;
  isFeatured: number;
  isFree: number;
  status: number;
  statusLabel: string;
  viewCount: number;
  enrollmentCount: number;
  trainerName: string | null;
  publishedAt: string | null;
  createdAt: string;
};

/** 课程详情中的开课计划（对齐后端 CoursePlanDTO） */
export type CoursePlanItem = {
  id: number;
  startTime: string;
  endTime: string;
  provinceId: number | null;
  cityId: number | null;
  districtId: number | null;
  address: string | null;
  onlineUrl: string | null;
  sortOrder: number | null;
};

/** 课程详情（对齐后端 CourseDetailVO） */
export type AdminCourseDetail = {
  id: number;
  title: string;
  type: string;
  typeLabel: string;
  publisherId: number | null;
  publisherType: string | null;
  publisherName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  subCategoryId: number | null;
  subCategoryName: string | null;
  coverUrl: string | null;
  intro: string | null;
  syllabus: string | null;
  audience: string | null;
  highlights: string | null;
  durationDays: number | null;
  hoursPerDay: number | null;
  price: number | null;
  originalPrice: number | null;
  keywords: string | null;
  trainerId: number | null;
  trainerName: string | null;
  isFeatured: number;
  isFree: number;
  hasPlan: number;
  status: number;
  statusLabel: string;
  rejectReason: string | null;
  sortOrder: number;
  viewCount: number;
  enrollmentCount: number;
  score: number | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  plans: CoursePlanItem[] | null;
};

export type CourseDetailResponse = {
  code: number;
  message: string;
  data: AdminCourseDetail;
};

/** 后台排课计划列表项（对齐 AdminCoursePlanVO） */
export type AdminCoursePlan = {
  id: number;
  courseId: number;
  courseTitle: string;
  courseType: string;
  courseTypeLabel: string;
  startTime: string;
  endTime: string;
  provinceId: number;
  cityId: number;
  districtId: number;
  address: string;
  onlineUrl: string;
  sortOrder: number;
  createdAt: string;
};

export type CourseFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
};

export type PlanFilters = {
  page?: number;
  limit?: number;
  search?: string;
  courseId?: number;
};

export type CoursesResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminCourse[];
  };
};

export type PlansResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminCoursePlan[];
  };
};

/** 课程状态值 → 文本 */
export const COURSE_STATUS_MAP: Record<number, string> = {
  0: '草稿',
  1: '待审核',
  2: '已上架',
  3: '驳回',
  4: '已下架'
};

/** 课程类型值 → 文本 */
export const COURSE_TYPE_MAP: Record<string, string> = {
  INTERNAL: '内训课',
  OPEN_OFFLINE: '线下公开课',
  OPEN_ONLINE: '线上公开课'
};

export const COURSE_STATUS_OPTIONS = [
  { value: '0', label: '草稿' },
  { value: '1', label: '待审核' },
  { value: '2', label: '已上架' },
  { value: '3', label: '驳回' },
  { value: '4', label: '已下架' }
];

export const COURSE_TYPE_OPTIONS = [
  { value: 'INTERNAL', label: '内训课' },
  { value: 'OPEN_OFFLINE', label: '线下公开课' },
  { value: 'OPEN_ONLINE', label: '线上公开课' }
];
