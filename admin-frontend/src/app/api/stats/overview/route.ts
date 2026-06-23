import { serverFetchWithStatus } from '@/lib/server-fetch';
import { NextResponse } from 'next/server';

export async function GET() {
  const { status, body: result } = await serverFetchWithStatus<unknown>('/admin/stats/overview');
  return NextResponse.json(result, { status: status >= 400 ? status : 200 });
}
