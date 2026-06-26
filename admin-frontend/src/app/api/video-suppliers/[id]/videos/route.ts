import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const { searchParams } = request.nextUrl;
  const page = searchParams.get('page') ?? '1';
  const size = searchParams.get('size') ?? '20';
  const result = await serverFetch<unknown>(
    `/admin/video-suppliers/${id}/videos?page=${page}&size=${size}`
  );
  return NextResponse.json(result);
}
