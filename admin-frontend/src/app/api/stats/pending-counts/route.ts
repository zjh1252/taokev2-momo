import { NextResponse } from 'next/server';
import { serverFetch } from '@/lib/server-fetch';

export async function GET() {
  try {
    const result = await serverFetch<unknown>('/admin/stats/pending-counts');
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : '无法连接后端或请求失败';
    return NextResponse.json({ code: 502, message, data: {} }, { status: 502 });
  }
}
