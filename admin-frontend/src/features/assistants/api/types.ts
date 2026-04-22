export type AdminAssistant = {
  id: number;
  userId: number;
  bio: string | null;
  authScope: string | null;
  createdAt: string;
};

export type AssistantFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
};

export type AssistantsResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminAssistant[];
  };
};
