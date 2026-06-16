import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const params = new URLSearchParams();
  params.set('page', searchParams.get('page') ?? '1');
  params.set('size', searchParams.get('size') ?? '10');

  const videoTitle = searchParams.get('videoTitle');
  if (videoTitle) params.set('keyword', videoTitle);
  const publisher = searchParams.get('publisher');
  if (publisher) params.set('publisherKeyword', publisher);
  for (const key of ['startDate', 'endDate', 'status']) {
    const val = searchParams.get(key);
    if (val) params.set(key, val);
  }

  const result = await serverFetch<unknown>(
    `/admin/video-orders?${params.toString()}`
  );
  return NextResponse.json(result);
}
