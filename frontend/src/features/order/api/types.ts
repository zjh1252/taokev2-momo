import type { ProductType } from '@/features/cart/api/types';

/** 订单状态 */
export type OrderStatusValue = 0 | 1 | 2 | 3 | 4;

/** 订单前台展示分类 */
export type OrderDisplayStatusValue =
  | 'PENDING'
  | 'PAYMENT_EXPIRED'
  | 'COURSE_EXPIRED'
  | 'PAID'
  | 'CANCELLED';

/** 订单明细 */
export interface OrderItemVO {
  id: number;
  productType: ProductType;
  productTypeLabel: string;
  productId: number;
  productTitle: string;
  productCover: string;
  price: number;
  quantity: number;
  subtotal: number;
  /** 录播课总集数（仅 VIDEO_COURSE 回填，单门课一般为 1，系列课为多集） */
  totalEpisodes?: number;
}

/** 订单 */
export interface OrderVO {
  id: number;
  orderNo: string;
  totalAmount: number;
  payAmount: number;
  status: OrderStatusValue;
  statusLabel: string;
  displayStatus?: OrderDisplayStatusValue;
  displayStatusLabel?: string;
  viewed?: boolean;
  remark: string;
  paidAt: string | null;
  expiredAt: string | null;
  validUntil?: string | null;
  createdAt: string;
  items: OrderItemVO[];
}

/** 我的订单未查看分类数量 */
export interface OrderUnviewedCountVO {
  pending: number;
  paymentExpired: number;
  courseExpired: number;
  paid: number;
  cancelled: number;
}

/** 创建订单（从购物车） */
export interface CreateOrderFromCartRequest {
  cartItemIds: number[];
  remark?: string;
}

/** 创建订单（直接购买） */
export interface CreateOrderDirectRequest {
  directItem: {
    productType: ProductType;
    productId: number;
    quantity?: number;
  };
  remark?: string;
}

export type CreateOrderRequest =
  | CreateOrderFromCartRequest
  | CreateOrderDirectRequest;

/** 发起支付请求 */
export interface PayRequest {
  orderNo: string;
  method?: string;
  clientType?: string;
}

/** 支付结果 */
export interface PayResultVO {
  paymentNo: string;
  orderNo: string;
  amount: number;
  method: string;
  status: number;
  statusLabel: string;
  paidAt: string | null;
  payUrl?: string | null;
  qrCodeUrl?: string | null;
  payParams?: Record<string, string> | null;
}

/** 发票类型：SPECIAL=全电发票-增值税专用发票 NORMAL=全电发票-普通发票 */
export type InvoiceType = 'SPECIAL' | 'NORMAL';

/** 抬头类型：PERSONAL=个人 COMPANY=企业 */
export type InvoiceTitleType = 'PERSONAL' | 'COMPANY';

/** 提交发票申请 */
export interface CreateInvoiceRequest {
  invoiceType: InvoiceType;
  titleType: InvoiceTitleType;
  title: string;
  taxNo?: string;
  bankName?: string;
  bankAccount?: string;
  companyAddress?: string;
  companyPhone?: string;
  email: string;
}

/** 发票申请记录 */
export interface InvoiceRequestVO {
  id: number;
  orderNo: string;
  invoiceType: InvoiceType;
  titleType: InvoiceTitleType;
  amount: number;
  title: string;
  taxNo: string;
  bankName: string;
  bankAccount: string;
  companyAddress: string;
  companyPhone: string;
  email: string;
  /** 状态：0=待开票 1=已开票 2=已驳回 */
  status: number;
  createdAt: string;
}

/** 通用 API 响应 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** 分页响应 */
export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}
