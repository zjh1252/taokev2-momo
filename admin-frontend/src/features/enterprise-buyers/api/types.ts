export type AdminEnterpriseBuyer = {
  id: number;
  userId: number;
  companyName: string | null;
  industry: string | null;
  companySize: string | null;
  contactName: string | null;
  contactPhone: string | null;
  createdAt: string;
};

export type EnterpriseBuyerFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
};

export type EnterpriseBuyersResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminEnterpriseBuyer[];
  };
};
