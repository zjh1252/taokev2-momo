import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const result = await serverFetch<unknown>(
    `/admin/demands/${id}/follow-ups`,
    { method: 'POST', body: JSON.stringify(body) }
  );
  return NextResponse.json(result);
}
