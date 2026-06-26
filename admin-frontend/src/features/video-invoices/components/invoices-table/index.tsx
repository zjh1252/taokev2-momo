'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { parseDateRangeQueryParam } from '@/lib/data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { videoInvoicesQueryOptions } from '../../api/queries';
import { columns } from './columns';
import { BatchActionBar } from './batch-action-bar';

export function VideoInvoicesTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    orderNo: parseAsString,
    videoName: parseAsString,
    status: parseAsString,
    invoiceType: parseAsString,
    titleType: parseAsString,
    user: parseAsString,
    dateRange: parseAsString
  });

  const { startDate, endDate } = parseDateRangeQueryParam(
    params.dateRange as string | string[] | null
  );

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.orderNo && { orderNo: params.orderNo }),
    ...(params.videoName && { videoName: params.videoName }),
    ...(params.status && { status: params.status }),
    ...(params.invoiceType && { invoiceType: params.invoiceType }),
    ...(params.titleType && { titleType: params.titleType }),
    ...(params.user && { user: params.user }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate })
  };

  const { data: resp } = useSuspenseQuery(videoInvoicesQueryOptions(filters));

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
      columnPinning: { right: ['actions'] }
    }
  });

  return (
    <DataTable table={table} actionBar={<BatchActionBar table={table} />}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
