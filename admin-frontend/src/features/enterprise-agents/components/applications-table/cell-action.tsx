'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { AdminEnterpriseAgentApplication } from '../../api/types';
import { Icons } from '@/components/icons';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { approveEAApplication, rejectEAApplication } from '../../api/service';
import { eaKeys } from '../../api/queries';

interface CellActionProps { data: AdminEnterpriseAgentApplication; }

export function CellAction({ data }: CellActionProps) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();
  const isPending = data.status === 2;

  const approveMutation = useMutation({
    mutationFn: () => approveEAApplication(data.userId),
    onSuccess: () => {
      toast.success('审核通过');
      setApproveOpen(false);
      void queryClient.invalidateQueries({ queryKey: eaKeys.all });
    },
    onError: (err: Error) => toast.error(err?.message || '操作失败'),
  });
  const rejectMutation = useMutation({
    mutationFn: () => rejectEAApplication(data.userId, reason),
    onSuccess: () => {
      toast.success('已驳回');
      setRejectOpen(false);
      setReason('');
      void queryClient.invalidateQueries({ queryKey: eaKeys.all });
    },
    onError: (err: Error) => toast.error(err?.message || '操作失败'),
  });

  return (
    <>
      <AlertModal isOpen={approveOpen} onClose={() => setApproveOpen(false)} onConfirm={() => approveMutation.mutate()} loading={approveMutation.isPending} title='确认通过' description={`确定要通过 ${data.companyName || data.nickname || '该用户'} 的经纪公司入驻申请吗？`} />
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader><DialogTitle>驳回申请</DialogTitle><DialogDescription>请填写驳回原因，申请人将收到通知。</DialogDescription></DialogHeader>
          <Textarea placeholder='请输入驳回原因...' value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant='outline' onClick={() => setRejectOpen(false)}>取消</Button>
            <Button variant='destructive' disabled={!reason.trim() || rejectMutation.isPending} onClick={() => rejectMutation.mutate()}>{rejectMutation.isPending ? '提交中...' : '确认驳回'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild><Button variant='ghost' className='h-8 w-8 p-0'><span className='sr-only'>打开菜单</span><Icons.ellipsis className='h-4 w-4' /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>操作</DropdownMenuLabel>
          {isPending && (<><DropdownMenuItem onClick={() => setApproveOpen(true)}><Icons.check className='mr-2 h-4 w-4' />通过</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setRejectOpen(true)}><Icons.close className='mr-2 h-4 w-4' />驳回</DropdownMenuItem></>)}
          {!isPending && (<DropdownMenuItem disabled><Icons.info className='mr-2 h-4 w-4' />{data.status === 1 ? '已通过' : data.status === 3 ? '已驳回' : '无可用操作'}</DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
