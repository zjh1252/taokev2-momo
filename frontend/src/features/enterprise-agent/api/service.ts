/**
 * 经纪公司角色相关 API 服务（经纪公司视角）。
 *
 * <p>当前实现基于 binding 模块通用 API：
 * <ul>
 *   <li>{@link listEnterpriseAgentMembers} ── 我的经纪人列表（含 PENDING/ACTIVE 等）</li>
 *   <li>{@link approveAgentByEnterprise} / {@link rejectAgentByEnterprise}
 *       ── 经纪公司对经纪人申请的审核</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-21 22:00
 */
export {
  listEnterpriseAgentMembers,
  approveAgentByEnterprise,
  rejectAgentByEnterprise,
  initiateBinding,
  unbind,
  lookupUserByPhone,
} from '@/features/binding/api/service';
export { BINDING_STATUS } from '@/features/binding/api/types';
export type { BindingItem } from '@/features/binding/api/types';
