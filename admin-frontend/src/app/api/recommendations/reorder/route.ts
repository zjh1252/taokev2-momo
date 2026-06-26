import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const result = await serverFetch<unknown>('/admin/recommendations/reorder', {
    method: 'PUT',
    body: JSON.stringify(body)
  });
  return NextResponse.json(result);
}
