import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

/** 获取用户业务角色 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await serverFetch<unknown>(`/admin/users/${id}/roles`);
  return NextResponse.json(result);
}

/** 授权用户业务角色（全量替换） */
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const result = await serverFetch<unknown>(`/admin/users/${id}/roles`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
  return NextResponse.json(result);
}
