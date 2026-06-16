'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { usersQueryOptions } from '../../api/queries';
import { columns } from './columns';

export function UsersTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    nickname: parseAsString,
    status: parseAsString,
    role: parseAsString,
    regOrigin: parseAsString,
    realNameCertStatus: parseAsString
  });

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.nickname && { search: params.nickname }),
    ...(params.status && { status: params.status }),
    ...(params.role && { role: params.role }),
    ...(params.regOrigin && { regOrigin: params.regOrigin }),
    ...(params.realNameCertStatus && {
      realNameCertStatus: params.realNameCertStatus
    })
  };

  const { data: resp } = useSuspenseQuery(usersQueryOptions(filters));

  const list = resp.data?.list ?? [];
  const total = resp.data?.total ?? 0;
  const pageCount = Math.ceil(total / params.perPage);

  const { table } = useDataTable({
    data: list,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    initialState: {
      columnPinning: { right: ['actions'] },
      columnVisibility: { role: false }
    }
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}

export function UsersTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
