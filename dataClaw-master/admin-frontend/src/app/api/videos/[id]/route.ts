import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

/**
 * 录播课详情 BFF：代理到后端 /admin/videos/{id}
 *
 * @author Fangxinxin
 * @date 2026-04-28 19:55
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await serverFetch<unknown>(`/admin/videos/${id}`);
  return NextResponse.json(result);
}
