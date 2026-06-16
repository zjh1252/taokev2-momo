import { apiGet, apiPost, apiPut } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import type {
  ApiResponse,
  PageResponse,
  OrderVO,
  CreateOrderRequest,
  CreateInvoiceRequest,
  InvoiceRequestVO,
  PayRequest,
  PayResultVO,
} from './types';

function authHeaders() {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return { Authorization: `Bearer ${tokenData?.accessToken || ''}` };
}

/** 创建订单 */
export async function createOrder(data: CreateOrderRequest): Promise<OrderVO> {
  const res = await apiPost<ApiResponse<OrderVO>>('/orders', data, {
    headers: authHeaders(),
  });
  return res.data;
}

/** 我的订单列表 */
export async function getOrders(params: {
  status?: number;
  page?: number;
  size?: number;
}): Promise<PageResponse<OrderVO>> {
  const query = new URLSearchParams();
  if (params.status !== undefined) query.set('status', String(params.status));
  if (params.page) query.set('page', String(params.page));
  if (params.size) query.set('size', String(params.size));
  const qs = query.toString();
  const res = await apiGet<ApiResponse<PageResponse<OrderVO>>>(
    `/orders${qs ? `?${qs}` : ''}`,
    { headers: authHeaders() },
  );
  return res.data;
}

/** 订单详情 */
export async function getOrderDetail(orderNo: string): Promise<OrderVO> {
  const res = await apiGet<ApiResponse<OrderVO>>(`/orders/${orderNo}`, {
    headers: authHeaders(),
  });
  return res.data;
}

/** 取消订单 */
export async function cancelOrder(orderNo: string): Promise<void> {
  await apiPut<ApiResponse<void>>(`/orders/${orderNo}/cancel`, undefined, {
    headers: authHeaders(),
  });
}

/** 提交发票申请 */
export async function submitInvoiceRequest(
  orderNo: string,
  data: CreateInvoiceRequest,
): Promise<InvoiceRequestVO> {
  const res = await apiPost<ApiResponse<InvoiceRequestVO>>(
    `/orders/${orderNo}/invoice`,
    data,
    { headers: authHeaders() },
  );
  return res.data;
}

/** 查询订单的发票申请（未申请时返回 null） */
export async function getInvoiceRequest(
  orderNo: string,
): Promise<InvoiceRequestVO | null> {
  const res = await apiGet<ApiResponse<InvoiceRequestVO | null>>(
    `/orders/${orderNo}/invoice`,
    { headers: authHeaders() },
  );
  return res.data;
}

/** 查询指定商品的有效待支付订单（无则 data 为 null） */
export async function getPendingOrderByProduct(
  productType: string,
  productId: number,
): Promise<OrderVO | null> {
  const params = new URLSearchParams({
    productType,
    productId: String(productId),
  });
  const res = await apiGet<ApiResponse<OrderVO | null>>(
    `/orders/pending-by-product?${params}`,
    { headers: authHeaders(), silent: true },
  );
  return res.data;
}

/** 发起支付 */
export async function pay(data: PayRequest): Promise<PayResultVO> {
  const res = await apiPost<ApiResponse<PayResultVO>>('/payments', data, {
    headers: authHeaders(),
  });
  return res.data;
}

/** 查询支付状态 */
export async function getPaymentStatus(
  paymentNo: string,
): Promise<PayResultVO> {
  const res = await apiGet<ApiResponse<PayResultVO>>(
    `/payments/${paymentNo}`,
    { headers: authHeaders() },
  );
  return res.data;
}
