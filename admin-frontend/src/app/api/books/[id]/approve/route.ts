import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/lib/server-fetch';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    const result = await serverFetch<unknown>(`/admin/books/${id}/approve`, {
      method: 'PUT'
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '无法连接后端或请求失败';
    return NextResponse.json({ code: 502, message }, { status: 502 });
  }
}
