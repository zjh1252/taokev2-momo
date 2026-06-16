import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{ id: string; videoId: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id, videoId } = await context.params;
  const body = await request.json();
  const result = await serverFetch<unknown>(
    `/admin/video-suppliers/${id}/videos/${videoId}/sort-order`,
    { method: 'PUT', body: JSON.stringify(body) }
  );
  return NextResponse.json(result);
}
