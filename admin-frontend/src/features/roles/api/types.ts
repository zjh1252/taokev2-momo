export type Role = {
  id: number;
  roleCode: string;
  roleName: string;
  description: string | null;
  isSystem: number;
  isActive: number;
  createdAt: string;
  permissionIds: number[];
};

export type SaveRolePayload = {
  roleCode: string;
  roleName: string;
  description?: string;
  isActive?: number;
};

export type AssignPermissionsPayload = {
  permissionIds: number[];
};
