export type Permission = {
  id: number;
  permissionCode: string;
  permissionName: string;
  module: string;
  actionType: string;
  parentId: number;
  sortOrder: number;
  description: string | null;
  children?: Permission[];
};

export type SavePermissionPayload = {
  permissionCode: string;
  permissionName: string;
  module: string;
  actionType: string;
  parentId: number;
  sortOrder?: number;
  description?: string;
};
