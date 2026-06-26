/**
 * 后台 — 三角色身份信息认证类型定义。
 *
 * <ul>
 *   <li>AGENT — 工作认证（多记录）</li>
 *   <li>ENTERPRISE_AGENT — 资质认证（公司Logo + 营业执照）</li>
 *   <li>INSTITUTION — 公司资料</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-16 21:00
 */

export type RoleCertFilters = {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
};

export const ROLE_CERT_STATUS_MAP: Record<number, string> = {
  1: '待审核',
  2: '已通过',
  3: '已驳回'
};

export const ROLE_CERT_STATUS_OPTIONS = [
  { value: '1', label: '待审核' },
  { value: '2', label: '已通过' },
  { value: '3', label: '已驳回' }
];

export type RoleCertPageResponse<T> = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: T[];
  };
};

/** 经纪人工作认证审核行 */
export type AdminAgentWorkCert = {
  id: number;
  agentId: number;
  userId: number;
  phone: string | null;
  nickname: string | null;
  realName: string | null;
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
