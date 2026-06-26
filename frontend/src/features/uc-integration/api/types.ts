/**
 * UC 组织成员对接类型。
 *
 * @author Fangxinxin
 * @date 2026-06-26 14:00
 */

export type UcOrgType = 'INSTITUTION' | 'ENTERPRISE_AGENT' | 'ENTERPRISE_BUYER';

export interface UcOrgLink {
  id: number;
  orgType: string;
  orgId: number;
  ucPRootId: number;
  uniqueValue?: number;
  uniqueFieldCode?: string;
  uniqueFieldLabel?: string;
}

export interface UcIdentityField {
  uniqueValue?: number;
  fieldCode: string;
  fieldLabel: string;
  placeholder: string;
}

export interface UcMemberLookupResult {
  matched: boolean;
  memberLinkId?: number;
  pStuId?: number;
  preview?: Record<string, unknown> | null;
  message?: string;
}

export interface UcMemberLinkItem {
  id: number;
  userId?: number;
  identityValue: string;
  pStuId?: number;
  syncStatus: number;
  profile?: Record<string, unknown> | null;
  bindingRefType?: string;
  bindingRefId?: number;
  createdAt?: string;
}
