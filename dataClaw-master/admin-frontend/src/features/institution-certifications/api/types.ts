export type InstitutionCertFilters = {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
};

export const INST_CERT_STATUS_MAP: Record<number, string> = {
  1: '待审核',
  2: '已通过',
  3: '已驳回'
};

export const INST_CERT_STATUS_OPTIONS = [
  { value: '1', label: '待审核' },
  { value: '2', label: '已通过' },
  { value: '3', label: '已驳回' }
];

export type InstitutionCertPage<T> = {
  code: number;
  message: string;
  data: { total: number; page: number; size: number; list: T[] };
};

/** 培训机构「公司资料」审核行 */
export type AdminInstitutionCompanyInfo = {
  institutionId: number;
  userId: number;
  phone: string | null;
  nickname: string | null;
  orgName: string | null;
  logoUrl: string | null;
  companyNature: string | null;
  website: string | null;
  companySize: string | null;
  annualRevenue: string | null;
  registeredCapital: string | null;
  provinceId: number | null;
  cityId: number | null;
  districtId: number | null;
  townId: number | null;
  address: string | null;
  postCode: string | null;
  maxCommissionRate: number | null;
  paymentMethods: string[] | null;
  hasCopyrightCourse: number | null;
  bankCardNo: string | null;
  bankName: string | null;
  bankBranch: string | null;
  licenseDocUrl: string | null;
  licenseNo: string | null;
  status: number;
  rejectReason: string | null;
  submittedAt: string | null;
  auditedAt: string | null;
};
