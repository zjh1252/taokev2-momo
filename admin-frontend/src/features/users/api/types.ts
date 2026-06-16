export type User = {
  id: number;
  phone: string;
  nickname: string | null;
  realName: string | null;
  avatarUrl: string | null;
  gender: number;
  status: number;
  freezeReason: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  roles: RoleItem[];
  regOrigin?: number | null;
  userSource?: number | null;
  courseCount?: number | null;
  caseCount?: number | null;
  realNameCertStatus?: number | null;
};

export type UserDetail = User & {
  email?: string | null;
  username?: string | null;
  provinceId?: number | null;
  cityId?: number | null;
  address?: string | null;
  trainerId?: number | null;
  trainerStatus?: number | null;
  videoCount?: number | null;
};

export type RoleItem = {
  role: string;
  status: number;
};

export type UserFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  regOrigin?: string;
  realNameCertStatus?: string;
};

export type UsersResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: User[];
  };
};

export type UserDetailResponse = {
  code: number;
  message: string;
  data: UserDetail;
};

export type CreateUserPayload = {
  phone: string;
  nickname: string;
  realName?: string;
};

export type UpdateUserStatusPayload = {
  status: number;
  freezeReason?: string;
};

export type UserBusinessRole = {
  roleCode: string;
  status: number;
};

export type AssignBusinessRolesPayload = {
  roleCodes: string[];
};

export const REG_ORIGIN_MAP: Record<number, string> = {
  1: 'PC',
  2: 'H5',
  3: '小程序',
  4: '运营创建'
};

export const REG_ORIGIN_OPTIONS = [
  { value: '1', label: 'PC' },
  { value: '2', label: 'H5' },
  { value: '3', label: '小程序' },
  { value: '4', label: '运营创建' }
];

export const REAL_NAME_CERT_STATUS_MAP: Record<number, string> = {
  1: '待审核',
  2: '已通过',
  3: '已驳回'
};

export const REAL_NAME_CERT_STATUS_OPTIONS = [
  { value: '1', label: '待审核' },
  { value: '2', label: '已通过' },
  { value: '3', label: '已驳回' }
];
