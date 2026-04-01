export type LoginPayload = {
  phone: string;
  password: string;
};

export type RegisterPayload = {
  phone: string;
  code: string;
  password: string;
  nickname?: string;
};

export type SendCodePayload = {
  target: string;
  type: string;
  sendType: string;
};

export type UserProfile = {
  id: number;
  phone: string;
  email: string | null;
  nickname: string | null;
  realName: string | null;
  avatarUrl: string | null;
  gender: number;
  status: number;
  hasPassword: boolean;
  roles: RoleInfo[];
  lastLoginAt: string | null;
  createdAt: string;
};

export type RoleInfo = {
  role: string;
  status: number;
  approvedAt: string | null;
};

export type ApiResult<T = void> = {
  code: number;
  message: string;
  data?: T;
};
