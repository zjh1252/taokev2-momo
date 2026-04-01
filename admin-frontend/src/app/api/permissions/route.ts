import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const tree = request.nextUrl.searchParams.get('tree');
  const endpoint = tree === '1' ? '/admin/permissions/tree' : '/admin/permissions';
  const result = await serverFetch<unknown>(endpoint);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await serverFetch<unknown>('/admin/permissions', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  return NextResponse.json(result);
}
