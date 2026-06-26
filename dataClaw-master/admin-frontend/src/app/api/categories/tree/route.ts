import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || '';
  const result = await serverFetch<unknown>(`/admin/categories/tree?type=${type}`);
  return NextResponse.json(result);
}
