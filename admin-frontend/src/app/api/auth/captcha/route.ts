import { serverFetchWithStatus } from '@/lib/server-fetch';
import { NextResponse } from 'next/server';

/**
 * BFF：生成滑块验证码（代理后端 POST /auth/captcha）。
 * tac SDK 以 POST 同源调用 /api/auth/captcha，原样透传后端（tianai 标准结构）。
 */
export async function POST() {
  const { status, body } = await serverFetchWithStatus<unknown>('/auth/captcha', {
    method: 'POST'
  });
  return NextResponse.json(body, { status });
}
