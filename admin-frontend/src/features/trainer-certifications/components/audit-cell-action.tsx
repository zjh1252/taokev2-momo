'use client';

import { InlineAuditActions } from '@/components/admin/inline-audit-actions';
import { certKeys } from '../api/queries';

interface AuditCellActionProps {
  /** 当前行状态：1=待审核 2=已通过 3=已驳回 */
  status: number;
  /** 显示用的目标名称（如真实姓名 / 单位 / 学校） */
  subjectLabel: string;
  /** 通过操作 */
  onApprove: () => Promise<unknown>;
  /** 驳回操作（接收原因） */
  onReject: (reason: string) => Promise<unknown>;
  /** 操作成功后用于失效缓存的 queryKey 前缀，默认走专家资质 certKeys.all */
  invalidateKey?: readonly unknown[];
}

/**
 * 资质认证审核行动操作（通过 / 驳回）通用组件。
 *
 * @author Fangxinxin
 * @date 2026-04-16 20:30
 */
export function AuditCellAction({
  status,
  subjectLabel,
  onApprove,
  onReject,
  invalidateKey
}: AuditCellActionProps) {
  const isPending = status === 1;

  return (
    <InlineAuditActions
      showApprove={isPending}
      showReject={isPending}
      subjectLabel={subjectLabel}
      approveDescription={`确定要通过【${subjectLabel}】的认证吗？通过后将立即生效，并向用户发送站内信通知。`}
      rejectTitle='驳回认证'
      rejectDescription='请填写驳回原因，用户将收到站内信通知，并可根据原因重新提交。'
      onApprove={onApprove}
      onReject={onReject}
      invalidateKey={invalidateKey ?? certKeys.all}
      idleLabel={
        status === 2 ? '已通过' : status === 3 ? '已驳回' : '无可用操作'
      }
    />
  );
}
