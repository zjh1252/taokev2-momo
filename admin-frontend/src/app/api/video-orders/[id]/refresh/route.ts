import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const result = await serverFetch<unknown>(`/admin/video-orders/${id}/refresh`, {
    method: 'POST'
  });
  return NextResponse.json(result);
}
