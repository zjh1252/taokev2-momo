/**
 * 培训合伙人申请 API 类型（对齐 OpenAPI AlliancePartnerApplicationResponse）
 *
 * 状态码与角色资料一致：1=已通过，2=待审核，3=已驳回
 */
export type AlliancePartnerApplicationDto = {
  id?: number;
  userId?: number;
  partnerCode?: string | null;
  contactName?: string | null;
  companyName?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  provinceId?: number | null;
  cityId?: number | null;
  legalPerson?: string | null;
  legalIdCard?: string | null;
  contactQq?: string | null;
  agreementVersion?: string | null;
  /** 1=已通过，2=待审核，3=已驳回 */
  status?: number | null;
  rejectReason?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

/** API 状态码 → 面板状态 */
export const PARTNER_API_STATUS = {
  APPROVED: 1,
  PENDING: 2,
  REJECTED: 3,
} as const;
