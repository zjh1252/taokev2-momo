import http from '@/utils/request';

/** 发起支付 */
export const pay = (data) => http.post('/payments', data);

/** 查询支付状态 */
export const getPaymentStatus = (paymentNo) => http.get(`/payments/${paymentNo}`);

/** 微信小程序 code 换 openId */
export const resolveWechatOpenId = (code) =>
  http.post('/payments/wechat/openid', { code });
