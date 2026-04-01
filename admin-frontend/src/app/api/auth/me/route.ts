import { serverFetch } from '@/lib/server-fetch';
import { NextResponse } from 'next/server';

export async function GET() {
  const result = await serverFetch<Record<string, unknown>>('/users/me');

  if (result.code !== 0) {
    return NextResponse.json(
      { code: result.code, message: result.message },
      { status: 401 }
    );
  }

  return NextResponse.json({ code: 0, message: 'success', data: result.data });
}
