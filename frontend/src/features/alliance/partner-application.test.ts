import { describe, expect, it, afterEach } from 'vitest';
import {
  PREVIEW_PARTNER_CODE,
  getPartnerApplicationStatus,
  parsePartnerPreviewStatus,
  shouldShowPartnerStatusPanel,
} from './partner-application';

describe('parsePartnerPreviewStatus', () => {
  it('accepts pending and approved case-insensitively', () => {
    expect(parsePartnerPreviewStatus('pending')).toBe('pending');
    expect(parsePartnerPreviewStatus('APPROVED')).toBe('approved');
    expect(parsePartnerPreviewStatus('Approved')).toBe('approved');
  });

  it('falls back to pending for missing or invalid values', () => {
    expect(parsePartnerPreviewStatus(null)).toBe('pending');
    expect(parsePartnerPreviewStatus(undefined)).toBe('pending');
    expect(parsePartnerPreviewStatus('')).toBe('pending');
    expect(parsePartnerPreviewStatus('rejected')).toBe('pending');
    expect(parsePartnerPreviewStatus('foo')).toBe('pending');
  });
});

describe('getPartnerApplicationStatus', () => {
  const original = process.env.NEXT_PUBLIC_PARTNER_STATUS_MOCK;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_PARTNER_STATUS_MOCK;
    } else {
      process.env.NEXT_PUBLIC_PARTNER_STATUS_MOCK = original;
    }
  });

  it('defaults to none when mock unset', () => {
    delete process.env.NEXT_PUBLIC_PARTNER_STATUS_MOCK;
    expect(getPartnerApplicationStatus()).toEqual({ status: 'none' });
  });

  it('returns pending + code when mock is pending', () => {
    process.env.NEXT_PUBLIC_PARTNER_STATUS_MOCK = 'pending';
    expect(getPartnerApplicationStatus()).toEqual({
      status: 'pending',
      partnerCode: PREVIEW_PARTNER_CODE,
    });
  });

  it('returns approved + code when mock is approved', () => {
    process.env.NEXT_PUBLIC_PARTNER_STATUS_MOCK = 'approved';
    expect(getPartnerApplicationStatus()).toEqual({
      status: 'approved',
      partnerCode: PREVIEW_PARTNER_CODE,
    });
  });

  it('treats rejected mock as none for UI branching this phase', () => {
    process.env.NEXT_PUBLIC_PARTNER_STATUS_MOCK = 'rejected';
    expect(getPartnerApplicationStatus()).toEqual({ status: 'none' });
  });

  it('normalizes mock value with surrounding whitespace', () => {
    process.env.NEXT_PUBLIC_PARTNER_STATUS_MOCK = ' PENDING ';
    expect(getPartnerApplicationStatus()).toEqual({
      status: 'pending',
      partnerCode: PREVIEW_PARTNER_CODE,
    });
  });
});

describe('shouldShowPartnerStatusPanel', () => {
  it('returns true for pending and approved', () => {
    expect(shouldShowPartnerStatusPanel('pending')).toBe(true);
    expect(shouldShowPartnerStatusPanel('approved')).toBe(true);
  });

  it('returns false for none and rejected', () => {
    expect(shouldShowPartnerStatusPanel('none')).toBe(false);
    expect(shouldShowPartnerStatusPanel('rejected')).toBe(false);
  });
});
