'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
  onReject
}: AuditCellActionProps) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const isPending = status === 1;

  const approveMutation = useMutation({
    mutationFn: () => onApprove(),
    onSuccess: () => {
      toast.success('审核已通过');
      setApproveOpen(false);
      void queryClient.invalidateQueries({ queryKey: certKeys.all });
    },
    onError: () => toast.error('操作失败')
  });

  const rejectMutation = useMutation({
    mutationFn: () => onReject(reason),
    onSuccess: () => {
      toast.success('已驳回');
      setRejectOpen(false);
      setReason('');
      void queryClient.invalidateQueries({ queryKey: certKeys.all });
    },
    onError: () => toast.error('操作失败')
  });

  return (
    <>
      <AlertModal
        isOpen={approveOpen}
        onClose={() => setApproveOpen(false)}
        onConfirm={() => approveMutation.mutate()}
        loading={approveMutation.isPending}
        title='确认通过'
        description={`确定要通过【${subjectLabel}】的认证吗？通过后将立即生效，并向用户发送站内信通知。`}
      />

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>驳回认证</DialogTitle>
            <DialogDescription>
              请填写驳回原因，用户将收到站内信通知，并可根据原因重新提交。
            </DialogDescription>
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

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>打开菜单</span>
            <Icons.ellipsis className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>操作</DropdownMenuLabel>
          {isPending ? (
            <>
              <DropdownMenuItem onClick={() => setApproveOpen(true)}>
                <Icons.check className='mr-2 h-4 w-4' />
                通过
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setRejectOpen(true)}>
                <Icons.close className='mr-2 h-4 w-4' />
                驳回
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem disabled>
              <Icons.info className='mr-2 h-4 w-4' />
              {status === 2 ? '已通过' : status === 3 ? '已驳回' : '无可用操作'}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
