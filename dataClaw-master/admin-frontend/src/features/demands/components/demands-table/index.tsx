'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { demandsQueryOptions } from '../../api/queries';
import { columns } from './columns';

export function DemandsTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    keyword: parseAsString,
    status: parseAsString,
    demandType: parseAsString
  });

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.keyword && { keyword: params.keyword }),
    ...(params.status && { status: params.status }),
    ...(params.demandType && { demandType: params.demandType })
  };

  const { data: resp } = useSuspenseQuery(demandsQueryOptions(filters));

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
