/**
 * 经纪人角色相关 API 服务（经纪人视角）。
 *
 * <p>当前实现基于 binding 模块通用 API：
 * <ul>
 *   <li>{@link listMyEnterpriseAgents} ── 我的经纪公司列表（含 PENDING/ACTIVE 等）</li>
 *   <li>{@link confirmBindingByAgent} / {@link rejectBindingByAgent}
 *       ── 经纪人对经纪公司邀请的确认 / 拒绝</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-21 22:00
 */
export {
  listMyEnterpriseAgents,
  confirmBindingByAgent,
  rejectBindingByAgent,
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

export interface EnterpriseAgentLookupItem {
  id: number;
  userId: number;
  companyName?: string;
  legalPerson?: string;
  contactName?: string;
}

/**
 * 公开接口 ── 按公司名关键字模糊搜索经纪公司，供经纪人申请时下拉选择。
 *
 * @param keyword 公司名关键字（可空 → 返回最新的 N 个）
 * @param size    最多返回的条目数（默认 20）
 */
export async function lookupEnterpriseAgents(
  keyword?: string,
  size = 20,
): Promise<EnterpriseAgentLookupItem[]> {
  const qs = new URLSearchParams();
  if (keyword) qs.set('keyword', keyword);
  qs.set('size', String(size));
  const res = await apiGet<ApiResponse<EnterpriseAgentLookupItem[]>>(
    `/enterprise-agents/lookup?${qs.toString()}`,
    { silent: true },
  );
  return res.data || [];
}
