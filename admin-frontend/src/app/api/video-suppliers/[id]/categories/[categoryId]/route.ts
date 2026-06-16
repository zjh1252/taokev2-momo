import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{ id: string; categoryId: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id, categoryId } = await context.params;
  const body = await request.json();
  const result = await serverFetch<unknown>(
    `/admin/video-suppliers/${id}/categories/${categoryId}`,
    { method: 'PUT', body: JSON.stringify(body) }
  );
  return NextResponse.json(result);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id, categoryId } = await context.params;
  const result = await serverFetch<unknown>(
    `/admin/video-suppliers/${id}/categories/${categoryId}`,
    { method: 'DELETE' }
  );
  return NextResponse.json(result);
}
