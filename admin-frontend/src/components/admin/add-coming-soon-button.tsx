'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';

export function AddComingSoonButton({ label = '添加' }: { label?: string }) {
  return (
    <Button
      type='button'
      onClick={() => toast.info('运营端创建功能开发中')}
    >
      <Icons.add className='mr-2 h-4 w-4' />
      {label}
    </Button>
  );
}
