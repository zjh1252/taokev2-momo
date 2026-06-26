import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

/**
 * 标记留言为已处理 BFF：代理到后端 /admin/trainer-messages/{id}/process
 *
 * @author Fangxinxin
 * @date 2026-04-28 19:55
 */
export async function PUT(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await serverFetch<unknown>(
    `/admin/trainer-messages/${id}/process`,
    { method: 'PUT' },
  );
  return NextResponse.json(result);
}
