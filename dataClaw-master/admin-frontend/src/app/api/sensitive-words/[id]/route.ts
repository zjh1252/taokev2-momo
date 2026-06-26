import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const result = await serverFetch<unknown>(`/admin/sensitive-words/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
  return NextResponse.json(result);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await serverFetch<unknown>(`/admin/sensitive-words/${id}`, {
    method: 'DELETE'
  });
  return NextResponse.json(result);
}
