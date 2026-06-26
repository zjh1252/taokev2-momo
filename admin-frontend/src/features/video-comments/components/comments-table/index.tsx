'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { videoCommentsQueryOptions } from '../../api/queries';
import { columns } from './columns';
import { BatchActionBar } from './batch-action-bar';

export function VideoCommentsTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    videoTitle: parseAsString,
    auditStatus: parseAsString,
    commentUser: parseAsString,
    publisher: parseAsString
  });

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.videoTitle && { videoTitle: params.videoTitle }),
    ...(params.auditStatus && { auditStatus: params.auditStatus }),
    ...(params.commentUser && { commentUser: params.commentUser }),
    ...(params.publisher && { publisher: params.publisher })
  };

  const { data: resp } = useSuspenseQuery(videoCommentsQueryOptions(filters));

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
