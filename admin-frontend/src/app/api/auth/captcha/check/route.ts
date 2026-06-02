import { serverFetchWithStatus } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

/**
 * BFF：校验滑块轨迹（代理后端 POST /auth/captcha/check）。
 * 原样透传请求体与后端响应（成功时 data.token 为一次性令牌）。
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { status, body: respBody } = await serverFetchWithStatus<unknown>('/auth/captcha/check', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  return NextResponse.json(respBody, { status });
}
