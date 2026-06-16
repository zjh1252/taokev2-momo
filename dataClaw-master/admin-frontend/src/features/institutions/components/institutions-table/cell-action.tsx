'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { AdminInstitution } from '../../api/types';
import { Icons } from '@/components/icons';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { setInstitutionAssociation } from '../../api/service';
import { institutionKeys } from '../../api/queries';

interface CellActionProps {
  data: AdminInstitution;
}

export function CellAction({ data }: CellActionProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const queryClient = useQueryClient();

  const toggleAssociation = !data.association;

  const mutation = useMutation({
    mutationFn: () => setInstitutionAssociation(data.id, toggleAssociation),
    onSuccess: () => {
      toast.success(toggleAssociation ? '已设为培训协会' : '已取消培训协会');
      setConfirmOpen(false);
      void queryClient.invalidateQueries({ queryKey: institutionKeys.all });
    },
    onError: () => toast.error('操作失败')
  });

  return (
    <>
      <AlertModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => mutation.mutate()}
        loading={mutation.isPending}
        title={toggleAssociation ? '设为培训协会' : '取消培训协会'}
        description={`确定要${toggleAssociation ? '将' : '取消'}"${data.orgName || '该机构'}"${toggleAssociation ? '设为培训协会' : '的培训协会标识'}吗？`}
      />

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>打开菜单</span>
            <Icons.ellipsis className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>操作</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setConfirmOpen(true)}>
            <Icons.building className='mr-2 h-4 w-4' />
            {data.association ? '取消培训协会' : '设为培训协会'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
