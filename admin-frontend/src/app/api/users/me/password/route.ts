import { serverFetchWithStatus } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

/** 当前登录用户修改密码（旧密码校验后改新密码），透传后端 HTTP status。 */
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { status, body: result } = await serverFetchWithStatus<unknown>('/users/me/password', {
    method: 'PUT',
    body: JSON.stringify(body)
  });
  return NextResponse.json(result, { status });
}
