import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = searchParams.get('page') ?? '1';
  const size = searchParams.get('limit') ?? '10';
  const status = searchParams.get('status') ?? '';

  const params = new URLSearchParams({ page, size });
  if (status) params.set('status', status);

  const result = await serverFetch<unknown>(
    `/admin/assistants/applications?${params.toString()}`
  );
  return NextResponse.json(result);
}
