import { serverFetchWithStatus } from '@/lib/server-fetch';
import { NextResponse } from 'next/server';

export async function GET() {
  const { status, body: result } = await serverFetchWithStatus<unknown>('/admin/search/overview');
  return NextResponse.json(result, { status });
}
