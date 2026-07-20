import { apiGet } from '@/lib/http/client';
import type { ApiResult } from '@/features/user/api/types';
import type { AlliancePartnerApplicationDto } from './types';

/**
 * 获取当前用户最新培训合伙人申请。
 * 无申请时 data 可能为 null。
 */
export function fetchMyPartnerApplication(init?: { silent?: boolean }) {
  return apiGet<ApiResult<AlliancePartnerApplicationDto | null>>(
    '/alliance/partners/me/application',
    { silent: init?.silent ?? true },
  );
}
