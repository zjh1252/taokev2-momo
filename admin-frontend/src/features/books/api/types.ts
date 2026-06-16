export type AdminBook = {
  id: number;
  coverUrl: string | null;
  title: string;
  authorName: string | null;
  trainerId: number;
  trainerName: string | null;
  submitterUserId: number | null;
  submitterNickname: string | null;
  createdAt: string;
  status: number;
  statusLabel: string;
  rejectReason: string | null;
  publisher: string | null;
  publishDate: string | null;
  description: string | null;
  buyUrl: string | null;
  reviewedAt: string | null;
};

export type BookFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
};

export type BooksResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminBook[];
  };
};

export type BookDetailResponse = {
  code: number;
  message: string;
  data: AdminBook;
};

export const BOOK_STATUS_MAP: Record<number, string> = {
  0: '待审核',
  1: '已通过',
  2: '已驳回'
};

export type CreateBookPayload = {
  trainerId: number;
  title: string;
  authorName?: string;
  coverUrl?: string;
  publisher?: string;
  publishDate?: string;
  description?: string;
  buyUrl?: string;
};

export const BOOK_STATUS_OPTIONS = [
  { value: '0', label: '待审核' },
  { value: '1', label: '已通过' },
  { value: '2', label: '已驳回' }
];
