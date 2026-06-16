import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const params = new URLSearchParams();
  params.set('page', searchParams.get('page') ?? '1');
  params.set('size', searchParams.get('size') ?? '10');

  const keyword = [
    searchParams.get('orderNo'),
    searchParams.get('videoName'),
    searchParams.get('user')
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (keyword) params.set('keyword', keyword);
  for (const key of ['status', 'startDate', 'endDate']) {
    const val = searchParams.get(key);
    if (val) params.set(key, val);
  }

  const result = await serverFetch<unknown>(
    `/admin/video-invoices?${params.toString()}`
  );
  return NextResponse.json(result);
}
