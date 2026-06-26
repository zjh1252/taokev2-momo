import { serverFetch } from '@/lib/server-fetch';
import { NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const result = await serverFetch<unknown>(`/admin/trainers/${id}`);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '无法连接后端或请求失败';
    return NextResponse.json({ code: 502, message }, { status: 502 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const result = await serverFetch<unknown>(`/admin/trainers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '无法连接后端或请求失败';
    return NextResponse.json({ code: 502, message }, { status: 502 });
  }
}
