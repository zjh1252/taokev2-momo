import { serverFetchWithStatus } from '@/lib/server-fetch';
import { NextResponse } from 'next/server';

export async function GET() {
  const { status, body: result } = await serverFetchWithStatus<Record<string, unknown>>('/users/me');

  if (result.code !== 0) {
    return NextResponse.json(
      { code: result.code, message: result.message },
      { status: status >= 400 ? status : 401 }
    );
  }

  return NextResponse.json({ code: 0, message: 'success', data: result.data });
}
