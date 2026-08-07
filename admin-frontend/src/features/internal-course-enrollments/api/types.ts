/** 内训课报名列表项（对齐后端 InternalCourseEnrollmentVO） */
export type InternalCourseEnrollment = {
  id: number;
  userId: number | null;
  courseId: number;
  realName: string;
  companyName: string;
  email: string;
  companyPhone: string | null;
  mobile: string | null;
  courseTitle: string;
  courseDeleted: boolean;
  status: number;
  statusLabel: string;
  adminRemark: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InternalCourseEnrollmentFilters = {
  page?: number;
  limit?: number;
  status?: string;
  keyword?: string;
  createdFrom?: string;
  createdTo?: string;
};

export type InternalCourseEnrollmentsResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: InternalCourseEnrollment[];
  };
};

export type InternalCourseEnrollmentDetailResponse = {
  code: number;
  message: string;
  data: InternalCourseEnrollment;
};

export const ENROLLMENT_STATUS_MAP: Record<number, string> = {
  0: '待处理',
  1: '已联系',
  2: '已无效',
};

export const ENROLLMENT_STATUS_OPTIONS = [
  { value: '0', label: '待处理' },
  { value: '1', label: '已联系' },
  { value: '2', label: '已无效' },
];
