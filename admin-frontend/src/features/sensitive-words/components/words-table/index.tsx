'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { sensitiveWordsQueryOptions } from '../../api/queries';
import { columns } from './columns';

export function SensitiveWordsTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(20),
    name: parseAsString,
    category: parseAsString,
    enabled: parseAsString
  });

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.name && { keyword: params.name }),
    ...(params.category && { category: Number(params.category) }),
    ...(params.enabled && { enabled: params.enabled })
  };

  const { data: resp } = useSuspenseQuery(
    sensitiveWordsQueryOptions(filters)
  );

  const list = resp.data?.list ?? [];
  const total = resp.data?.total ?? 0;
  const pageCount = Math.ceil(total / params.perPage);

  const { table } = useDataTable({
    data: list,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}

export function SensitiveWordsTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
