import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

/** 变更用户状态（冻结/解冻） */
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  const result = await serverFetch<unknown>(`/admin/users/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });

  return NextResponse.json(result);
}
