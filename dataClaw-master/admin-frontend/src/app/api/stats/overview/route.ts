import { serverFetch } from '@/lib/server-fetch';
import { NextResponse } from 'next/server';

export async function GET() {
  const result = await serverFetch<unknown>('/admin/stats/overview');
  return NextResponse.json(result);
}
