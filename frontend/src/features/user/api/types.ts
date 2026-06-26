/** 角色信息（与后端 UserProfileResponse.RoleInfo 对齐） */
export interface RoleInfo {
  /** 角色编码，如 BUYER / TRAINER / INSTITUTION 等 */
  role: string;
  /** 状态：1=生效, 2=待审核, 3=审核驳回, 4=已禁用 */
  status: number;
  /** 是否「已生效身份资料重审中」（status=1 且重新提交了角色资料，原身份仍可用） */
  reapplying?: boolean;
  approvedAt: string | null;
}

/**
 * 用户个人资料（GET /users/me 响应体）
 * <p>与后端 UserProfileResponse DTO 保持一致</p>
 */
export interface UserProfileResponse {
  id: number;
  phone: string;
  email: string | null;
  nickname: string | null;
  realName: string | null;
  avatarUrl: string | null;
  /** 学习标签（个人学员），逗号分隔关键词 */
  studyTags: string | null;
  gender: number | null;
  postCode: string | null;
  provinceId: number | null;
  cityId: number | null;
  districtId: number | null;
  townId: number | null;
  address: string | null;
  status: number;
  lastLoginAt: string | null;
  createdAt: string;
  hasPassword: boolean;
  roles: RoleInfo[];
}

/** 通用 API 响应包装 */
export interface ApiResult<T = unknown> {
  code: string;
  message: string;
  data: T;
}
