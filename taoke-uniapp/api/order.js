import http from '@/utils/request';

/** 创建订单（购物车或直接购买） */
export const createOrder = (data) => http.post('/orders', data);

/** 我的订单列表 */
export const listOrders = (params) => http.get('/orders', params);

/** 订单详情 */
export const getOrderDetail = (orderNo) => http.get(`/orders/${orderNo}`);

/** 取消订单 */
export const cancelOrder = (orderNo) => http.put(`/orders/${orderNo}/cancel`);

/** 查询指定商品的有效待支付订单 */
export const getPendingOrderByProduct = (productType, productId) =>
  http.get('/orders/pending-by-product', { productType, productId }, { silent: true });
