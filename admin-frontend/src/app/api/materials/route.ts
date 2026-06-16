import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

function buildQuery(searchParams: URLSearchParams) {
  const params = new URLSearchParams();
  const page = searchParams.get('page') ?? '1';
  const size = searchParams.get('size') ?? searchParams.get('limit') ?? '20';
  params.set('page', page);
  params.set('size', size);

  for (const key of [
    'materialType',
    'keyword',
    'category',
    'scene',
    'enabled',
    'isDefault'
  ]) {
    const value = searchParams.get(key);
    if (value) params.set(key, value);
  }
  return params;
}

export async function GET(request: NextRequest) {
  const params = buildQuery(request.nextUrl.searchParams);
  const result = await serverFetch<unknown>(`/admin/materials?${params.toString()}`);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await serverFetch<unknown>('/admin/materials', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  return NextResponse.json(result);
}
