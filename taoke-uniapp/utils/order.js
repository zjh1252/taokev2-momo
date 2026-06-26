/** 订单状态样式 */
export function orderStatusClass(status) {
  switch (status) {
    case 0: return 'is-pending';
    case 1: return 'is-paid';
    case 2: return 'is-cancelled';
    case 3: return 'is-refunding';
    case 4: return 'is-refunded';
    default: return '';
  }
}

export function formatOrderAmount(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function getOrderProductTitle(order) {
  return order?.items?.[0]?.productTitle || '课程';
}

export function getWatchVideoIdFromOrder(order) {
  const item = (order?.items || []).find((i) => i.productType === 'VIDEO_COURSE');
  return item?.productId;
}
