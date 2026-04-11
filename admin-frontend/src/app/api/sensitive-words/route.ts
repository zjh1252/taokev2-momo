import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const page = searchParams.get('page') ?? '1';
  const size = searchParams.get('limit') ?? '20';
  const keyword = searchParams.get('keyword') ?? '';
  const category = searchParams.get('category') ?? '';

  const params = new URLSearchParams({ page, size });
  if (keyword) params.set('keyword', keyword);
  if (category) params.set('category', category);

  const result = await serverFetch<unknown>(
    `/admin/sensitive-words?${params.toString()}`
  );
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await serverFetch<unknown>('/admin/sensitive-words', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  return NextResponse.json(result);
}
