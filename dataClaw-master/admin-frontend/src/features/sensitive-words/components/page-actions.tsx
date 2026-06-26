'use client';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { reloadSensitiveWords } from '../api/service';
import { sensitiveWordKeys } from '../api/queries';
import { SensitiveWordFormDialog } from './word-form-dialog';
import { ImportDialog } from './import-dialog';

export function SensitiveWordPageActions() {
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const queryClient = useQueryClient();

  const reloadMutation = useMutation({
    mutationFn: reloadSensitiveWords,
    onSuccess: () => {
      toast.success('词库已重载');
      void queryClient.invalidateQueries({
        queryKey: sensitiveWordKeys.all
      });
    },
    onError: () => toast.error('重载失败')
  });

  return (
    <>
      <div className='flex gap-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => reloadMutation.mutate()}
          disabled={reloadMutation.isPending}
        >
          <Icons.spinner
            className={`mr-1 h-4 w-4 ${reloadMutation.isPending ? 'animate-spin' : ''}`}
          />
          重载词库
        </Button>
        <Button variant='outline' size='sm' onClick={() => setImportOpen(true)}>
          <Icons.upload className='mr-1 h-4 w-4' />
          批量导入
        </Button>
        <Button size='sm' onClick={() => setCreateOpen(true)}>
          <Icons.add className='mr-1 h-4 w-4' />
          新增
        </Button>
      </div>

      <SensitiveWordFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}
