import { serverFetch, USE_SECURE_COOKIE } from '@/lib/server-fetch';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { code: 401, message: '未登录' },
      { status: 401 }
    );
  }

  const result = await serverFetch<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken })
  });

  if (result.code !== 0) {
    cookieStore.delete('access_token');
    cookieStore.delete('refresh_token');
    return NextResponse.json(
      { code: result.code, message: result.message },
      { status: 401 }
    );
  }

  const { accessToken, refreshToken: newRefreshToken, expiresIn } = result.data;

  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: USE_SECURE_COOKIE,
    sameSite: 'lax',
    path: '/',
    maxAge: expiresIn
  });

  cookieStore.set('refresh_token', newRefreshToken, {
    httpOnly: true,
    secure: USE_SECURE_COOKIE,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60
  });

  return NextResponse.json({ code: 0, message: 'success' });
}
