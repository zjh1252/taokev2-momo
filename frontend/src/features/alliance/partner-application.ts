import { ApiException } from '@/lib/http/client';
import { fetchMyPartnerApplication } from './api/service';
import {
  PARTNER_API_STATUS,
  type AlliancePartnerApplicationDto,
} from './api/types';
import type {
  PartnerApplicationSnapshot,
  PartnerApplicationStatus,
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

/** 将后端 status 整型映射为前端快照状态 */
export function mapPartnerApiStatus(
  status: number | null | undefined,
): PartnerApplicationStatus {
  if (status === PARTNER_API_STATUS.APPROVED) return 'approved';
  if (status === PARTNER_API_STATUS.PENDING) return 'pending';
  if (status === PARTNER_API_STATUS.REJECTED) return 'rejected';
  return 'none';
}

export function snapshotFromPartnerDto(
  dto: AlliancePartnerApplicationDto | null | undefined,
): PartnerApplicationSnapshot {
  if (!dto) return { status: 'none' };
  const status = mapPartnerApiStatus(dto.status);
  if (status === 'none') return { status: 'none' };
  const partnerCode = dto.partnerCode?.trim() || undefined;
  return partnerCode ? { status, partnerCode } : { status };
}

/**
 * 本地 mock（优先于 API）：NEXT_PUBLIC_PARTNER_STATUS_MOCK=pending|approved
 * rejected mock 本期按 none（仍显示表单）。
 */
export function getPartnerApplicationStatusFromMock(): PartnerApplicationSnapshot | null {
  const mock = (process.env.NEXT_PUBLIC_PARTNER_STATUS_MOCK ?? '')
    .trim()
    .toLowerCase();
  if (mock === 'pending') {
    return { status: 'pending', partnerCode: PREVIEW_PARTNER_CODE };
  }
  if (mock === 'approved') {
    return { status: 'approved', partnerCode: PREVIEW_PARTNER_CODE };
  }
  if (mock === 'none' || mock === 'rejected') {
    return { status: 'none' };
  }
  return null;
}

/**
 * @deprecated 请用 {@link fetchPartnerApplicationStatus}；仅保留给单测 mock 同步场景。
 */
export function getPartnerApplicationStatus(): PartnerApplicationSnapshot {
  return getPartnerApplicationStatusFromMock() ?? { status: 'none' };
}

/**
 * 真实页申请状态：先读 mock，再请求 GET /alliance/partners/me/application。
 * rejected 本期按 none 处理（仍显示表单）。
 */
export async function fetchPartnerApplicationStatus(): Promise<PartnerApplicationSnapshot> {
  const mocked = getPartnerApplicationStatusFromMock();
  if (mocked) return mocked;

  try {
    const res = await fetchMyPartnerApplication({ silent: true });
    const snapshot = snapshotFromPartnerDto(res?.data ?? null);
    // 本期驳回不接新 UI
    if (snapshot.status === 'rejected') return { status: 'none' };
    return snapshot;
  } catch (err) {
    if (err instanceof ApiException && (err.status === 404 || err.status === 401)) {
      return { status: 'none' };
    }
    return { status: 'none' };
  }
}

/** 真实页是否应渲染状态面板 */
export function shouldShowPartnerStatusPanel(
  status: PartnerApplicationSnapshot['status'],
): status is PartnerPanelStatus {
  return status === 'pending' || status === 'approved';
}
