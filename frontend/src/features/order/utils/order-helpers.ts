import type { OrderVO } from '../api/types';

/** 是否为录播课订单（单门或全系列） */
export function isVideoOrder(order: OrderVO): boolean {
  return (
    order.items?.length > 0 &&
    order.items.every(
      (item) =>
        item.productType === 'VIDEO_COURSE' || item.productType === 'VIDEO_PACKAGE',
    )
  );
}

/** 订单主商品标题（用于支付弹窗） */
export function getOrderProductTitle(order: OrderVO): string {
  return order.items?.[0]?.productTitle ?? '课程';
}

/** 支付成功后引导观看的录播课 ID */
export function getWatchVideoIdFromOrder(order: OrderVO): number | undefined {
  const videoItem = order.items?.find((item) => item.productType === 'VIDEO_COURSE');
  return videoItem?.productId;
}

/** 课程有效期截止时间（录播课有效期一年，自支付时间起算；未支付返回 null） */
export function getOrderAccessExpiry(order: OrderVO): Date | null {
  if (order.validUntil) {
    const expiry = new Date(order.validUntil);
    return Number.isNaN(expiry.getTime()) ? null : expiry;
  }
  if (!order.paidAt) return null;
  const expiry = new Date(order.paidAt);
  expiry.setFullYear(expiry.getFullYear() + 1);
  return expiry;
}

/** 已支付订单是否已过一年有效期 */
export function isOrderAccessExpired(order: OrderVO): boolean {
  const expiry = getOrderAccessExpiry(order);
  return expiry !== null && expiry.getTime() < Date.now();
}
