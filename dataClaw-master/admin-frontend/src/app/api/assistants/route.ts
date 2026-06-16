import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = searchParams.get('page') ?? '1';
  const size = searchParams.get('limit') ?? '10';
  const search = searchParams.get('search') ?? '';

  const params = new URLSearchParams({ page, size });
  if (search) params.set('search', search);

  const result = await serverFetch<unknown>(
    `/admin/assistants?${params.toString()}`
  );
  return NextResponse.json(result);
}
