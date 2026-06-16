import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const suffix = request.nextUrl.pathname.endsWith('/enabled')
    ? 'enabled'
    : 'default';
  const result = await serverFetch<unknown>(`/admin/materials/${id}/${suffix}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
  return NextResponse.json(result);
}
