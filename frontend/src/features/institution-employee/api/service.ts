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
