import { describe, expect, it } from 'vitest';
import type { OrderVO } from '../api/types';
import {
  ORDER_TABS,
  getOrderTabRequestParams,
  parseOrderTab,
} from './order-display-status';
import { getOrderAccessExpiry } from './order-helpers';

describe('order display status', () => {
  it('uses the new order tabs without the legacy expired tab', () => {
    expect(ORDER_TABS.map((tab) => tab.key)).toEqual([
      'all',
      'pending',
      'paymentExpired',
      'courseExpired',
      'paid',
      'cancelled',
    ]);

    expect(parseOrderTab('expired')).toBe('all');
  });

  it('maps tabs to backend displayStatus filters', () => {
    expect(getOrderTabRequestParams('paymentExpired')).toEqual({
      displayStatus: 'PAYMENT_EXPIRED',
    });
    expect(getOrderTabRequestParams('courseExpired')).toEqual({
      displayStatus: 'COURSE_EXPIRED',
    });
    expect(getOrderTabRequestParams('all')).toEqual({});
  });

  it('prefers server validUntil when showing course access expiry', () => {
    const order = {
      paidAt: '2026-01-01T10:00:00',
      validUntil: '2026-08-01T00:00:00',
    } as OrderVO;

    const expiry = getOrderAccessExpiry(order);
    expect(expiry?.getFullYear()).toBe(2026);
    expect(expiry?.getMonth()).toBe(7);
    expect(expiry?.getDate()).toBe(1);
  });
});
