import { NextResponse } from 'next/server';
import { serverFetchWithStatus } from '@/lib/server-fetch';

export async function GET() {
  const { status, body: result } = await serverFetchWithStatus<unknown>('/admin/stats/pending-counts');
  return NextResponse.json(result, { status: status >= 400 ? status : 200 });
}
