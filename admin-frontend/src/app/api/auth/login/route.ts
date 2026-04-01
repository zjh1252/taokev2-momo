import { serverFetch } from '@/lib/server-fetch';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = await serverFetch<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body)
  });

  if (result.code !== 0) {
    return NextResponse.json(
      { code: result.code, message: result.message },
      { status: 400 }
    );
  }

  const { accessToken, refreshToken, expiresIn } = result.data;
  const cookieStore = await cookies();

  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: expiresIn
  });

  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 // 30 天
  });

  return NextResponse.json({ code: 0, message: 'success' });
}
