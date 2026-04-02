import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const query = type ? `?type=${type}` : '';
  const result = await serverFetch<unknown>(`/admin/roles${query}`);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await serverFetch<unknown>('/admin/roles', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  return NextResponse.json(result);
}
