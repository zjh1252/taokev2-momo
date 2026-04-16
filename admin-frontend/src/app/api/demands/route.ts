import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const page = searchParams.get('page') ?? '1';
  const size = searchParams.get('size') ?? '20';
  const status = searchParams.get('status') ?? '';
  const demandType = searchParams.get('demandType') ?? '';
  const keyword = searchParams.get('keyword') ?? '';

  const params = new URLSearchParams({ page, size });
  if (status) params.set('status', status);
  if (demandType) params.set('demandType', demandType);
  if (keyword) params.set('keyword', keyword);

  const result = await serverFetch<unknown>(
    `/admin/demands?${params.toString()}`
  );
  return NextResponse.json(result);
}
