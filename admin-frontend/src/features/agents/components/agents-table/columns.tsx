'use client';
import type { AdminAgent } from '../../api/types';
import { ColumnDef } from '@tanstack/react-table';

export const columns: ColumnDef<AdminAgent>[] = [
  { accessorKey: 'id', header: 'ID', enableSorting: false },
  { accessorKey: 'bio', header: '服务介绍', cell: ({ cell }) => { const val = cell.getValue<string>(); return val ? (val.length > 50 ? val.slice(0, 50) + '...' : val) : '-'; } },
  { accessorKey: 'specialties', header: '擅长领域', cell: ({ cell }) => cell.getValue<string>() || '-' },
  { accessorKey: 'createdAt', header: '创建时间', cell: ({ cell }) => { const val = cell.getValue<string>(); if (!val) return '-'; return new Date(val).toLocaleDateString('zh-CN'); } }
];
