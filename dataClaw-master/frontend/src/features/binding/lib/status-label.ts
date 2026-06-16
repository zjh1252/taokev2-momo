/**
 * 绑定关系状态文案：按当前视角动态映射
 *
 * <p>后端 {@code BindingStatus} 只返回单一中文 label（如 PENDING -&gt; 「待确认」），
 * 但同一条记录在「我发起的」与「对方发起的」两端语义不同：
 * <ul>
 *   <li>PENDING + ifInitiator -&gt; 「待对方确认」</li>
 *   <li>PENDING + !ifInitiator -&gt; 「待我确认」</li>
 *   <li>REJECTED + ifInitiator -&gt; 「对方已拒绝」</li>
 *   <li>REJECTED + !ifInitiator -&gt; 「我已拒绝」</li>
 *   <li>ACTIVE -&gt; 「已生效」</li>
 *   <li>UNBOUND -&gt; 「已解绑」</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-28 18:05
 */
import { BINDING_STATUS, type BindingItem } from '@/features/binding/api/types';

/**
 * 根据「当前视角」返回应显示的状态文案
 *
 * @param item 绑定列表项
 * @returns 视角化文案；若状态未知则回退到后端返回的 statusLabel
 */
export function getDisplayStatusLabel(item: BindingItem): string {
  switch (item.status) {
    case BINDING_STATUS.PENDING:
      return item.ifInitiator ? '待对方确认' : '待我确认';
    case BINDING_STATUS.REJECTED:
      return item.ifInitiator ? '对方已拒绝' : '我已拒绝';
    case BINDING_STATUS.ACTIVE:
      return '已生效';
    case BINDING_STATUS.UNBOUND:
      return '已解绑';
    default:
      return item.statusLabel ?? '';
  }
}
