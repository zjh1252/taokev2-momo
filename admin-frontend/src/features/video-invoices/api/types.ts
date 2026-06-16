export type AdminVideoInvoice = {
  id: number;
  orderNo: string;
  videoName: string;
  userId: number;
  userName: string;
  invoiceType: string;
  invoiceTypeLabel: string;
  titleType: string;
  titleTypeLabel: string;
  title: string;
  amount: number;
  status: string;
  statusLabel: string;
  email: string | null;
  createdAt: string;
  issuedAt: string | null;
};

export type VideoInvoiceFilters = {
  page?: number;
  limit?: number;
  orderNo?: string;
  videoName?: string;
  status?: string;
  invoiceType?: string;
  titleType?: string;
  startDate?: string;
  endDate?: string;
  user?: string;
};

export type VideoInvoicesResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminVideoInvoice[];
  };
};

export const VIDEO_INVOICE_STATUS_MAP: Record<string, string> = {
  PENDING: '待开票',
  PROCESSING: '开票中',
  ISSUED: '已开票',
  FAILED: '开票失败',
  REJECTED: '已驳回'
};

export const VIDEO_INVOICE_STATUS_OPTIONS = [
  { value: 'PENDING', label: '待开票' },
  { value: 'PROCESSING', label: '开票中' },
  { value: 'ISSUED', label: '已开票' },
  { value: 'FAILED', label: '开票失败' },
  { value: 'REJECTED', label: '已驳回' }
];

export const INVOICE_TYPE_OPTIONS = [
  { value: 'NORMAL', label: '普通发票' },
  { value: 'SPECIAL', label: '增值税专用发票' }
];

export const TITLE_TYPE_OPTIONS = [
  { value: 'PERSONAL', label: '个人' },
  { value: 'COMPANY', label: '企业' }
];
