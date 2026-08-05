import config from '@/configs';
import * as paymentApi from '@/api/payment';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

/** 当前端类型，对应后端 PaymentClientType */
export function getPaymentClientType() {
  // #ifdef MP-WEIXIN
  return 'MINI_PROGRAM';
  // #endif

  // #ifdef APP-PLUS
  return 'APP';
  // #endif

  // #ifdef H5
  return 'H5';
  // #endif

  return 'H5';
}

/** 真实支付未接通前统一使用 MOCK，点击即成功 */
const FORCE_MOCK_PAYMENT = true;

/** 当前端默认支付方式 */
export function getDefaultPaymentMethod() {
  if (FORCE_MOCK_PAYMENT) {
    return 'MOCK';
  }
  // #ifdef MP-WEIXIN
  return 'WECHAT';
  // #endif
  return 'WECHAT';
}

/** 是否展示模拟支付（当前阶段强制开启） */
export function canUseMockPayment() {
  return FORCE_MOCK_PAYMENT || config.isDev;
}

/** 是否强制 MOCK 支付 */
export function isForceMockPayment() {
  return FORCE_MOCK_PAYMENT;
}

/** 微信小程序 login code 换 openId */
export async function resolveWechatOpenId() {
  const loginRes = await new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: resolve,
      fail: reject,
    });
  });

  const code = loginRes?.code;
  if (!code) {
    throw new Error('微信登录失败，无法获取 code');
  }

  const data = await paymentApi.resolveWechatOpenId(code);
  if (!data?.openId) {
    throw new Error('未能获取微信 openId');
  }
  return data.openId;
}

/** 调起第三方支付 */
export async function invokeThirdPartyPayment(payResult) {
  if (payResult?.status === 1) {
    return true;
  }

  if (payResult?.payParams) {
    await new Promise((resolve, reject) => {
      uni.requestPayment({
        provider: 'wxpay',
        timeStamp: payResult.payParams.timeStamp,
        nonceStr: payResult.payParams.nonceStr,
        package: payResult.payParams.package,
        signType: payResult.payParams.signType || 'RSA',
        paySign: payResult.payParams.paySign,
        success: resolve,
        fail: reject,
      });
    });
    return true;
  }

  if (payResult?.payUrl) {
    // #ifdef H5
    window.location.href = payResult.payUrl;
    return false;
    // #endif

    // #ifdef APP-PLUS
    plus.runtime.openURL(payResult.payUrl);
    return false;
    // #endif

    // #ifdef MP-WEIXIN
    throw new Error('当前环境不支持跳转支付');
    // #endif
  }

  if (payResult?.qrCodeUrl) {
    throw new Error('请使用 PC 端扫码支付');
  }

  throw new Error('未获取到支付参数');
}

/** 轮询支付结果，直到成功或超时 */
export function pollPaymentUntilPaid(paymentNo, onTick) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const timer = setInterval(async () => {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        clearInterval(timer);
        reject(new Error('支付超时，请稍后在订单页查看状态'));
        return;
      }

      try {
        const status = await paymentApi.getPaymentStatus(paymentNo);
        onTick?.(status);
        if (status?.status === 1) {
          clearInterval(timer);
          resolve(status);
        }
      } catch (_) {
        // 静默重试
      }
    }, POLL_INTERVAL_MS);
  });
}

/** 发起支付并处理各端调起逻辑 */
export async function checkoutPay({ orderNo, method, openId }) {
  const payload = {
    orderNo,
    method: FORCE_MOCK_PAYMENT ? 'MOCK' : method,
    clientType: getPaymentClientType(),
  };

  if (openId) {
    payload.openId = openId;
  }

  const payResult = await paymentApi.pay(payload);
  if (payResult?.status === 1) {
    return payResult;
  }

  const invoked = await invokeThirdPartyPayment(payResult);
  if (invoked) {
    return paymentApi.getPaymentStatus(payResult.paymentNo);
  }

  return pollPaymentUntilPaid(payResult.paymentNo);
}
