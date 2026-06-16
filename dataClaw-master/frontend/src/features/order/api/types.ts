import type { ProductType } from '@/features/cart/api/types';

/** 订单状态 */
export type OrderStatusValue = 0 | 1 | 2 | 3 | 4;

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
}

/** 订单 */
export interface OrderVO {
  id: number;
  orderNo: string;
  totalAmount: number;
  payAmount: number;
  status: OrderStatusValue;
  statusLabel: string;
  remark: string;
  paidAt: string | null;
  expiredAt: string | null;
  createdAt: string;
  items: OrderItemVO[];
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
