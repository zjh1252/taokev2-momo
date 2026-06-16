import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 留言列表 BFF：代理到后端 /admin/trainer-messages
 *
 * @author Fangxinxin
 * @date 2026-04-28 19:55
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = searchParams.get('page') ?? '1';
  const size = searchParams.get('limit') ?? '20';
  const status = searchParams.get('status') ?? '';
  const trainerUserId = searchParams.get('trainerUserId') ?? '';
  const keyword = searchParams.get('keyword') ?? '';

  const params = new URLSearchParams({ page, size });
  if (status) params.set('status', status);
  if (trainerUserId) params.set('trainerUserId', trainerUserId);
  if (keyword) params.set('keyword', keyword);

  const result = await serverFetch<unknown>(
    `/admin/trainer-messages?${params.toString()}`,
  );
  return NextResponse.json(result);
}
