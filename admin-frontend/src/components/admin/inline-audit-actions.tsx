'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';

export type InlineAuditActionsProps = {
  /** 是否显示通过按钮 */
  showApprove?: boolean;
  /** 是否显示驳回按钮 */
  showReject?: boolean;
  /** 是否显示隐藏按钮 */
  showHide?: boolean;
  /** 非待审时的只读状态文案 */
  idleLabel?: string;
  /** 确认弹窗中的对象描述 */
  subjectLabel: string;
  approveTitle?: string;
  approveDescription?: string;
  rejectTitle?: string;
  rejectDescription?: string;
  hideTitle?: string;
  hideDescription?: string;
  onApprove: () => Promise<unknown>;
  onReject: (reason: string) => Promise<unknown>;
  onHide?: () => Promise<unknown>;
  invalidateKey?: readonly unknown[];
  /** 额外操作按钮（如「详情」） */
  extra?: ReactNode;
  size?: 'sm' | 'default';
};

/**
 * 审核列表内联操作按钮（通过 / 驳回 / 隐藏），替代下拉菜单。
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
export function InlineAuditActions({
  showApprove = false,
  showReject = false,
  showHide = false,
  idleLabel,
  subjectLabel,
  approveTitle = '确认通过',
  approveDescription,
  rejectTitle = '驳回',
  rejectDescription = '请填写驳回原因，用户将收到站内信通知。',
  hideTitle = '隐藏',
  hideDescription,
  onApprove,
  onReject,
  onHide,
  invalidateKey,
  extra,
  size = 'sm'
}: InlineAuditActionsProps) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [hideOpen, setHideOpen] = useState(false);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (invalidateKey) {
      void queryClient.invalidateQueries({ queryKey: invalidateKey });
    }
  };

  const approveMutation = useMutation({
    mutationFn: () => onApprove(),
    onSuccess: () => {
      toast.success('操作成功');
      setApproveOpen(false);
      invalidate();
    },
    onError: () => toast.error('操作失败')
  });

  const rejectMutation = useMutation({
    mutationFn: () => onReject(reason),
    onSuccess: () => {
      toast.success('已驳回');
      setRejectOpen(false);
      setReason('');
      invalidate();
    },
    onError: () => toast.error('操作失败')
  });

  const hideMutation = useMutation({
    mutationFn: () => (onHide ? onHide() : Promise.reject()),
    onSuccess: () => {
      toast.success('已隐藏');
      setHideOpen(false);
      invalidate();
    },
    onError: () => toast.error('操作失败')
  });

  const hasActions = showApprove || showReject || showHide || extra;

  return (
    <>
      <AlertModal
        isOpen={approveOpen}
        onClose={() => setApproveOpen(false)}
        onConfirm={() => approveMutation.mutate()}
        loading={approveMutation.isPending}
        title={approveTitle}
        description={
          approveDescription ?? `确定要通过【${subjectLabel}】吗？`
        }
      />

      {onHide ? (
        <AlertModal
          isOpen={hideOpen}
          onClose={() => setHideOpen(false)}
          onConfirm={() => hideMutation.mutate()}
          loading={hideMutation.isPending}
          title={hideTitle}
          description={hideDescription ?? `确定要隐藏【${subjectLabel}】吗？`}
        />
      ) : null}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{rejectTitle}</DialogTitle>
            <DialogDescription>{rejectDescription}</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder='请输入驳回原因...'
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setRejectOpen(false)}>
              取消
            </Button>
            <Button
              variant='destructive'
              disabled={!reason.trim() || rejectMutation.isPending}
              onClick={() => rejectMutation.mutate()}
            >
              {rejectMutation.isPending ? '提交中...' : '确认驳回'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className='flex flex-wrap items-center gap-1.5'>
        {showApprove ? (
          <Button
            size={size}
            variant='default'
            onClick={() => setApproveOpen(true)}
            disabled={approveMutation.isPending}
          >
            通过
          </Button>
        ) : null}
        {showReject ? (
          <Button
            size={size}
            variant='outline'
            onClick={() => setRejectOpen(true)}
            disabled={rejectMutation.isPending}
          >
            驳回
          </Button>
        ) : null}
        {showHide && onHide ? (
          <Button
            size={size}
            variant='secondary'
            onClick={() => setHideOpen(true)}
            disabled={hideMutation.isPending}
          >
            隐藏
          </Button>
        ) : null}
        {extra}
        {!hasActions && idleLabel ? (
          <span className='text-muted-foreground text-xs'>{idleLabel}</span>
        ) : null}
      </div>
    </>
  );
}
