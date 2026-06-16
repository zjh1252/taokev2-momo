/**
 * 后台 — 专家四维度资质认证（实名 / 专业 / 学历 / 工作）类型定义。
 *
 * @author Fangxinxin
 * @date 2026-04-16 20:00
 */

/** 通用查询参数 */
export type CertFilters = {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
};

/** 状态映射：1=待审核 2=已通过 3=已驳回 */
export const CERT_STATUS_MAP: Record<number, string> = {
  1: '待审核',
  2: '已通过',
  3: '已驳回'
};

export const CERT_STATUS_OPTIONS = [
  { value: '1', label: '待审核' },
  { value: '2', label: '已通过' },
  { value: '3', label: '已驳回' }
];

/** 后端 PageResult 包装 */
export type CertPageResponse<T> = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: T[];
  };
};

export type AdminRealNameCert = {
  trainerId: number;
  userId: number;
  phone: string | null;
  nickname: string | null;
  realName: string | null;
  idCardNo: string | null;
  idCardFront: string | null;
  idCardBack: string | null;
  status: number;
  rejectReason: string | null;
  submittedAt: string | null;
  auditedAt: string | null;
};

export type AdminProfessionalCert = {
  trainerId: number;
  userId: number;
  phone: string | null;
  nickname: string | null;
  realName: string | null;
  files: string[];
  status: number;
  rejectReason: string | null;
  submittedAt: string | null;
  auditedAt: string | null;
};

export type AdminEducationCert = {
  id: number;
  trainerId: number;
  userId: number;
  phone: string | null;
  nickname: string | null;
  holderName: string | null;
  schoolName: string | null;
  major: string | null;
  degree: string | null;
  startDate: string | null;
  endDate: string | null;
  isGraduated: number | null;
  proofFile: string | null;
  status: number;
  rejectReason: string | null;
  submittedAt: string | null;
  auditedAt: string | null;
};

export type AdminWorkCert = {
  id: number;
  trainerId: number;
  userId: number;
  phone: string | null;
  nickname: string | null;
  companyName: string | null;
  position: string | null;
  startDate: string | null;
  endDate: string | null;
  jobDescription: string | null;
  proofFile: string | null;
  status: number;
  rejectReason: string | null;
  submittedAt: string | null;
  auditedAt: string | null;
};
