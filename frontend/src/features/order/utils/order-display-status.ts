import type { OrderDisplayStatusValue } from '../api/types';

export type OrderTabKey =
  | 'all'
  | 'pending'
  | 'paymentExpired'
  | 'courseExpired'
  | 'paid'
  | 'cancelled';

export interface OrderTabConfig {
  key: OrderTabKey;
  label: string;
  displayStatus?: OrderDisplayStatusValue;
  countKey?: keyof OrderUnviewedCountMap;
}

export interface OrderUnviewedCountMap {
  pending: number;
  paymentExpired: number;
  courseExpired: number;
  paid: number;
  cancelled: number;
}

export const EMPTY_ORDER_UNVIEWED_COUNTS: OrderUnviewedCountMap = {
  pending: 0,
  paymentExpired: 0,
  courseExpired: 0,
  paid: 0,
  cancelled: 0,
};

export const ORDER_TABS: OrderTabConfig[] = [
  { key: 'all', label: '全部订单' },
  {
    key: 'pending',
    label: '待支付',
    displayStatus: 'PENDING',
    countKey: 'pending',
  },
  {
    key: 'paymentExpired',
    label: '支付过期',
    displayStatus: 'PAYMENT_EXPIRED',
    countKey: 'paymentExpired',
  },
  {
    key: 'courseExpired',
    label: '过期课程',
    displayStatus: 'COURSE_EXPIRED',
    countKey: 'courseExpired',
  },
  {
    key: 'paid',
    label: '已完成',
    displayStatus: 'PAID',
    countKey: 'paid',
  },
  {
    key: 'cancelled',
    label: '已取消',
    displayStatus: 'CANCELLED',
    countKey: 'cancelled',
  },
];

const VALID_TABS = new Set<OrderTabKey>(ORDER_TABS.map((tab) => tab.key));

export function parseOrderTab(value: string | null): OrderTabKey {
  if (value && VALID_TABS.has(value as OrderTabKey)) {
    return value as OrderTabKey;
  }
  return 'all';
}

export function getOrderTabRequestParams(tab: OrderTabKey): {
  displayStatus?: OrderDisplayStatusValue;
} {
  const displayStatus = ORDER_TABS.find((item) => item.key === tab)?.displayStatus;
  return displayStatus ? { displayStatus } : {};
}
