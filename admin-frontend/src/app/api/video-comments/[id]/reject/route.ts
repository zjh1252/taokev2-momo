import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const result = await serverFetch<unknown>(`/admin/video-comments/${id}/reject`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
  return NextResponse.json(result);
}
