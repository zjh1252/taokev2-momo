'use client';

import { useEffect, useMemo } from 'react';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import type { MaterialType } from '../../constants';
import type { Material } from '../../api/types';
import { buildMaterialColumns } from './columns';

type MaterialsTableProps = {
  materialType: MaterialType;
  list: Material[];
  pageCount: number;
  onSelectionChange: (ids: number[]) => void;
};

export function MaterialsTable({
  materialType,
  list,
  pageCount,
  onSelectionChange
}: MaterialsTableProps) {
  const columns = useMemo(
    () => buildMaterialColumns(materialType),
    [materialType]
  );

  const { table } = useDataTable({
    data: list,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    enableRowSelection: true,
    initialState: {
      columnPinning: { right: ['actions'] }
    }
  });

  const rowSelection = table.getState().rowSelection;

  useEffect(() => {
    const ids = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.id);
    onSelectionChange(ids);
  }, [table, rowSelection, onSelectionChange]);

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
