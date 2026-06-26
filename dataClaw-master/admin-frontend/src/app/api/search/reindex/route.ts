import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const result = await serverFetch<unknown>('/admin/search/reindex', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  return NextResponse.json(result);
}
