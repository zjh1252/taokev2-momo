import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const page = searchParams.get('page') ?? '1';
  const size = searchParams.get('limit') ?? '10';
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const sortBy = searchParams.get('sortBy') ?? '';
  const sortDirection = searchParams.get('sortDirection') ?? '';

  const params = new URLSearchParams({ page, size });
  if (search) params.set('keyword', search);
  if (status) params.set('status', status);
  if (sortBy) params.set('sortBy', sortBy);
  if (sortDirection) params.set('sortDirection', sortDirection);

  const result = await serverFetch<unknown>(
    `/admin/videos?${params.toString()}`
  );
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await serverFetch<unknown>('/admin/videos', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  return NextResponse.json(result);
}
