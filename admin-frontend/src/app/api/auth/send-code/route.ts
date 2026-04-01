import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = await serverFetch<void>('/auth/send-code', {
    method: 'POST',
    body: JSON.stringify(body)
  });

  if (result.code !== 0) {
    return NextResponse.json(
      { code: result.code, message: result.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ code: 0, message: 'success' });
}
