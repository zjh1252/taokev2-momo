import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const page = searchParams.get('page') ?? '1';
  const size = searchParams.get('limit') ?? '10';
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const type = searchParams.get('type') ?? '';

  const params = new URLSearchParams({ page, size });
  if (search) params.set('keyword', search);
  if (status) params.set('status', status);
  if (type) params.set('type', type);

  const result = await serverFetch<unknown>(
    `/admin/courses?${params.toString()}`
  );
  return NextResponse.json(result);
}
