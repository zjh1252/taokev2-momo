'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { parseDateRangeQueryParam } from '@/lib/data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { videoOrdersQueryOptions } from '../../api/queries';
import { columns } from './columns';

export function VideoOrdersTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    videoTitle: parseAsString,
    status: parseAsString,
    publisher: parseAsString,
    dateRange: parseAsString
  });

  const { startDate, endDate } = parseDateRangeQueryParam(
    params.dateRange as string | string[] | null
  );

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.videoTitle && { videoTitle: params.videoTitle }),
    ...(params.status && { status: params.status }),
    ...(params.publisher && { publisher: params.publisher }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate })
  };

  const { data: resp } = useSuspenseQuery(videoOrdersQueryOptions(filters));

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
      columnVisibility: { dateRange: false }
    }
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
