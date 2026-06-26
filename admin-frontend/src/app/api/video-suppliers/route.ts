import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const params = new URLSearchParams();
  params.set('page', searchParams.get('page') ?? '1');
  params.set('size', searchParams.get('size') ?? '10');
  const search = searchParams.get('search');
  if (search) params.set('search', search);

  const result = await serverFetch<unknown>(
    `/admin/video-suppliers?${params.toString()}`
  );
  return NextResponse.json(result);
}
