import { serverFetchWithStatus } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { status, body: result } = await serverFetchWithStatus<unknown>('/admin/footer/config', {
    method: 'PUT',
    body: JSON.stringify(body)
  });
  return NextResponse.json(result, { status: status >= 400 ? status : 200 });
}
