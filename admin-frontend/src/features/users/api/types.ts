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

export type UpdateUserStatusPayload = {
  status: number;
  freezeReason?: string;
};
