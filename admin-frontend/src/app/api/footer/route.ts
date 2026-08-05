import { serverFetchWithStatus } from '@/lib/server-fetch';
import { NextResponse } from 'next/server';

export async function GET() {
  const { status, body } = await serverFetchWithStatus<unknown>('/admin/footer');
  return NextResponse.json(body, { status: status >= 400 ? status : 200 });
}
