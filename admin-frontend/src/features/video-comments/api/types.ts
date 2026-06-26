export type AdminVideoComment = {
  id: number;
  videoId: number;
  videoTitle: string;
  userId: number;
  userName: string;
  content: string;
  rating: number;
  auditStatus: number;
  auditStatusLabel: string;
  publisherType: string | null;
  publisherName: string | null;
  createdAt: string;
};

export type VideoCommentFilters = {
  page?: number;
  limit?: number;
  videoTitle?: string;
  auditStatus?: string;
  commentUser?: string;
  publisher?: string;
};

export type VideoCommentsResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminVideoComment[];
  };
};

export const VIDEO_COMMENT_AUDIT_MAP: Record<number, string> = {
  0: '待审核',
  1: '已通过',
  2: '已驳回'
};

export const VIDEO_COMMENT_AUDIT_OPTIONS = [
  { value: '0', label: '待审核' },
  { value: '1', label: '已通过' },
  { value: '2', label: '已驳回' }
];
