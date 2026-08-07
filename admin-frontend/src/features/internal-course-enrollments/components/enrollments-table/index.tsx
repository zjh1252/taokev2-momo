'use client';

import { useTransition } from 'react';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDataTable } from '@/hooks/use-data-table';
import { Icons } from '@/components/icons';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { toast } from 'sonner';
import {
  internalCourseEnrollmentKeys,
  internalCourseEnrollmentsQueryOptions,
} from '../../api/queries';
import { exportInternalCourseEnrollments } from '../../api/service';
import { columns } from './columns';

export function InternalCourseEnrollmentsTable() {
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();
  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    status: parseAsString,
    keyword: parseAsString,
    createdFrom: parseAsString,
    createdTo: parseAsString,
  });

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.status && { status: params.status }),
    ...(params.keyword && { keyword: params.keyword }),
    ...(params.createdFrom && { createdFrom: params.createdFrom }),
    ...(params.createdTo && { createdTo: params.createdTo }),
  };

  const { data: resp } = useSuspenseQuery(
    internalCourseEnrollmentsQueryOptions(filters),
  );

  const list = resp.data?.list ?? [];
  const total = resp.data?.total ?? 0;
  const pageCount = Math.ceil(total / params.perPage) || 1;

  const { table } = useDataTable({
    data: list,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
  });

  const selectedIds = table
    .getFilteredSelectedRowModel()
    .rows.map((r) => r.original.id);

  const handleRefresh = () => {
    startTransition(() => {
      void queryClient.invalidateQueries({
        queryKey: internalCourseEnrollmentKeys.all,
      });
    });
  };

  const handleExport = async (mode: 'selected' | 'all') => {
    try {
      if (mode === 'selected') {
        if (selectedIds.length === 0) {
          toast.error('请先勾选要导出的记录');
          return;
        }
        await exportInternalCourseEnrollments({ ids: selectedIds });
      } else {
        await exportInternalCourseEnrollments({ filters });
      }
      toast.success('导出成功');
    } catch {
      toast.error('导出失败');
    }
  };

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <div className='flex flex-wrap items-end gap-3'>
        <div className='space-y-1'>
          <label className='text-muted-foreground text-xs'>提交时间起</label>
          <Input
            type='datetime-local'
            className='w-[210px]'
            value={params.createdFrom?.replace(' ', 'T').slice(0, 16) ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              void setParams({
                createdFrom: v ? `${v.replace('T', ' ')}:00` : null,
                page: 1,
              });
            }}
          />
        </div>
        <div className='space-y-1'>
          <label className='text-muted-foreground text-xs'>提交时间止</label>
          <Input
            type='datetime-local'
            className='w-[210px]'
            value={params.createdTo?.replace(' ', 'T').slice(0, 16) ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              void setParams({
                createdTo: v ? `${v.replace('T', ' ')}:00` : null,
                page: 1,
              });
            }}
          />
        </div>
        <div className='ml-auto flex flex-wrap gap-2'>
          <Button
            variant='outline'
            size='sm'
            disabled={pending}
            onClick={handleRefresh}
          >
            <Icons.refresh className='mr-1 h-4 w-4' />
            刷新
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => void handleExport('selected')}
          >
            <Icons.fileTypeXls className='mr-1 h-4 w-4' />
            导出选中
          </Button>
          <Button size='sm' onClick={() => void handleExport('all')}>
            <Icons.fileTypeXls className='mr-1 h-4 w-4' />
            导出全部
          </Button>
        </div>
      </div>

      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </div>
  );
}

export function InternalCourseEnrollmentsTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
