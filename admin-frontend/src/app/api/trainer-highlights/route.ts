import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const page = searchParams.get('page') ?? '1';
  const size = searchParams.get('limit') ?? '20';
  const trainerId = searchParams.get('trainerId') ?? '';
  const status = searchParams.get('status') ?? '';
  const keyword = searchParams.get('keyword') ?? '';

  const params = new URLSearchParams({ page, size });
  if (trainerId) params.set('trainerId', trainerId);
  if (status) params.set('status', status);
  if (keyword) params.set('keyword', keyword);

  const result = await serverFetch<unknown>(
    `/admin/trainer-highlights?${params.toString()}`
  );
  return NextResponse.json(result);
}
