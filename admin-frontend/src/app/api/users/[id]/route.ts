import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

/** 用户详情 */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const result = await serverFetch<unknown>(`/admin/users/${id}`);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '无法连接后端或请求失败';
    return NextResponse.json({ code: 502, message }, { status: 502 });
  }
}

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
