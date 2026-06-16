export type AdminVideoOrderItem = {
  id: number;
  productType: string;
  productTypeLabel: string;
  productId: number;
  productTitle: string;
  productCover: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  totalEpisodes: number | null;
};

export type AdminVideoOrder = {
  id: number;
  orderNo: string;
  userId: number;
  userName: string;
  videoTitles: string;
  payAmount: number;
  status: number;
  statusLabel: string;
  learnerCount: number;
  createdAt: string;
  paidAt: string | null;
  items?: AdminVideoOrderItem[];
};

export type AdminVideoOrderDetail = AdminVideoOrder;

export type VideoOrderFilters = {
  page?: number;
  limit?: number;
  videoTitle?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  publisher?: string;
};

export type VideoOrdersResponse = {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    list: AdminVideoOrder[];
  };
};

export type VideoOrderDetailResponse = {
  code: number;
  message: string;
  data: AdminVideoOrderDetail;
};

export const VIDEO_ORDER_STATUS_MAP: Record<number, string> = {
  0: '待支付',
  1: '已支付',
  2: '已取消',
  3: '已退款',
  4: '已过期'
};

export const VIDEO_ORDER_STATUS_OPTIONS = [
  { value: '0', label: '待支付' },
  { value: '1', label: '已支付' },
  { value: '2', label: '已取消' },
  { value: '3', label: '已退款' },
  { value: '4', label: '已过期' }
];
