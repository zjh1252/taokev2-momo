export type AdminVideoSupplier = {
  id: number;
  userId: number;
  companyName: string;
  memberType: string;
  memberTypeLabel: string;
  enabled: boolean;
  videoCount: number;
  categoryCount: number;
  createdAt: string;
};

export type VideoSupplierFilters = {
  page?: number;
  limit?: number;
  search?: string;
};

export type VideoSuppliersResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminVideoSupplier[];
  };
};

export type UpdateVideoSupplierPayload = {
  companyName: string;
  memberType: string;
  enabled: boolean;
};

export type SupplierCategoryNode = {
  id: number;
  parentId: number;
  name: string;
  level: number;
  sortOrder: number;
  children: SupplierCategoryNode[] | null;
};

export type SaveSupplierCategoryPayload = {
  parentId?: number;
  name: string;
  sortOrder?: number;
};

export type SupplierVideoItem = {
  id: number;
  title: string;
  categoryNames: string[];
  status: number;
  statusLabel: string;
  sortOrder: number;
  createdAt: string;
};

export type SupplierVideosResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: SupplierVideoItem[];
  };
};

export const SUPPLIER_MEMBER_TYPE_OPTIONS = [
  { value: 'STANDARD', label: '标准会员' },
  { value: 'PREMIUM', label: '高级会员' },
  { value: 'ENTERPRISE', label: '企业会员' }
];
