'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import type { AdminVideoSupplier } from '../../api/types';
import Link from 'next/link';
import { useState } from 'react';
import { SupplierEditDialog } from '../supplier-edit-dialog';

interface CellActionProps {
  data: AdminVideoSupplier;
}

export function CellAction({ data }: CellActionProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <SupplierEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        supplier={data}
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
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Icons.edit className='mr-2 h-4 w-4' />
            编辑
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/video-suppliers/${data.id}/categories`}>
              <Icons.adjustments className='mr-2 h-4 w-4' />
              分类管理
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/video-suppliers/${data.id}/videos`}>
              <Icons.video className='mr-2 h-4 w-4' />
              视频管理
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
