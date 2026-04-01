import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

/** 分配权限（全量替换） */
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const result = await serverFetch<unknown>(`/admin/roles/${id}/permissions`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
  return NextResponse.json(result);
}
