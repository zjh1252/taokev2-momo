/**
 * 机构员工角色相关 API 服务（员工视角）。
 *
 * <p>当前实现基于 binding 模块通用 API：
 * <ul>
 *   <li>{@link listMyInstitutions} ── 我的机构列表（含 PENDING/ACTIVE 等）</li>
 *   <li>{@link confirmBindingByEmployee} / {@link rejectBindingByEmployee}
 *       ── 员工对机构邀请的确认 / 拒绝</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-21 22:00
 */
export {
  listMyInstitutions,
  confirmBindingByEmployee,
  rejectBindingByEmployee,
  unbind,
} from '@/features/binding/api/service';
export { BINDING_STATUS } from '@/features/binding/api/types';
export type { BindingItem } from '@/features/binding/api/types';

import { apiGet } from '@/lib/http/client';

interface ApiResponse<T> {
  code: string;
  message?: string;
  data: T;
}

/**
 * 机构下拉/搜索用的轻量条目。
 */
export interface InstitutionLookupItem {
  id: number;
  userId: number;
  orgName?: string;
  /** 是否培训协会 */
  association?: boolean;
  /** 详细地址 */
  address?: string;
}

/**
 * 公开接口 ── 按机构名关键字模糊搜索机构。
 *
 * @param keyword 机构名关键字（可空 → 返回最新的 N 条）
 * @param size    最多返回的条目数（默认 20）
 */
export async function lookupInstitutions(
  keyword?: string,
  size = 20,
): Promise<InstitutionLookupItem[]> {
  const qs = new URLSearchParams();
  if (keyword) qs.set('keyword', keyword);
  qs.set('size', String(size));
  const res = await apiGet<ApiResponse<InstitutionLookupItem[]>>(
    `/institutions/lookup?${qs.toString()}`,
    { silent: true },
  );
  return res.data || [];
}
