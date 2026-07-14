import type {
  PartnerApplicationSnapshot,
  PartnerPanelStatus,
} from './types';

/** Figma 示例编号；预览与 mock 共用 */
export const PREVIEW_PARTNER_CODE = 'TPC_20260714134819240966';

/**
 * 解析预览 query。非法 / 缺省 → pending。
 */
export function parsePartnerPreviewStatus(
  raw: string | null | undefined,
): PartnerPanelStatus {
  const v = (raw ?? '').trim().toLowerCase();
  if (v === 'approved') return 'approved';
  if (v === 'pending') return 'pending';
  return 'pending';
}

/**
 * 真实页申请状态适配层。
 * 本期无 API：默认 none；可用 NEXT_PUBLIC_PARTNER_STATUS_MOCK=pending|approved 联调。
 * rejected mock 本期按 none 返回（仍显示表单），与 design spec 一致。
 */
export function getPartnerApplicationStatus(): PartnerApplicationSnapshot {
  const mock = (process.env.NEXT_PUBLIC_PARTNER_STATUS_MOCK ?? '')
    .trim()
    .toLowerCase();
  if (mock === 'pending') {
    return { status: 'pending', partnerCode: PREVIEW_PARTNER_CODE };
  }
  if (mock === 'approved') {
    return { status: 'approved', partnerCode: PREVIEW_PARTNER_CODE };
  }
  // rejected 及其它 → none
  return { status: 'none' };
}

/** 真实页是否应渲染状态面板 */
export function shouldShowPartnerStatusPanel(
  status: PartnerApplicationSnapshot['status'],
): status is PartnerPanelStatus {
  return status === 'pending' || status === 'approved';
}
