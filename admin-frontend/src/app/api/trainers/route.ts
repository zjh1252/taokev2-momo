import { serverFetchWithStatus } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const page = searchParams.get('page') ?? '1';
  const size = searchParams.get('limit') ?? '10';
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';

  const params = new URLSearchParams({ page, size });
  if (search) params.set('search', search);
  if (status) params.set('status', status);

  const { status: httpStatus, body } = await serverFetchWithStatus<unknown>(
    `/admin/trainers?${params.toString()}`
  );
  return NextResponse.json(body, { status: httpStatus >= 400 ? httpStatus : 200 });
}
