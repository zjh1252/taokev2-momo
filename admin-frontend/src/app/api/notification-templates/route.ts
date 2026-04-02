import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const result = await serverFetch<unknown>('/admin/notification-templates');
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await serverFetch<unknown>('/admin/notification-templates', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  return NextResponse.json(result);
}
