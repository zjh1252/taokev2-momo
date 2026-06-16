export type AdminInstitution = {
  id: number;
  userId: number;
  orgName: string;
  orgType: number;
  status: number;
  score: number;
  isCertified: number;
  isRecommended: number;
  association: boolean;
  viewCount: number;
  contactName: string | null;
  contactPhone: string | null;
  createdAt: string;
};

export type AdminInstitutionApplication = {
  /** 申请ID（每一次入驻申请记录的标识） */
  id: number;
  userId: number;
  /** 机构ID（正式档案唯一标识，审核通过后才有值） */
  institutionId: number | null;
  phone: string | null;
  nickname: string | null;
  orgName: string | null;
  logoUrl: string | null;
  contactName: string | null;
  contactPhone: string | null;
  status: number;
  /** 已生效身份资料重审中（二次申请） */
  reapplying: boolean | null;
  rejectReason: string | null;
  createdAt: string;
  /** 最近提交时间（二次申请后更新） */
  updatedAt: string | null;
  approvedAt: string | null;
};

export type InstitutionFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
};

export type InstitutionsResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminInstitution[];
  };
};

export type InstitutionApplicationsResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminInstitutionApplication[];
  };
};

/** 机构状态文本映射 */
export const INSTITUTION_STATUS_MAP: Record<number, string> = {
  0: '待审核',
  1: '已发布',
  2: '已下线'
};

/** 申请状态文本映射（UserRole 表） */
export const APPLICATION_STATUS_MAP: Record<number, string> = {
  1: '已通过',
  2: '待审核',
  3: '已驳回',
  4: '已禁用'
};

export const INSTITUTION_STATUS_OPTIONS = [
  { value: '0', label: '待审核' },
  { value: '1', label: '已发布' },
  { value: '2', label: '已下线' }
];

export const APPLICATION_STATUS_OPTIONS = [
  { value: '2', label: '待审核' },
  { value: '1', label: '已通过' },
  { value: '3', label: '已驳回' }
];
