import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

/**
 * 留言转需求 BFF：代理到后端 POST /admin/trainer-messages/{id}/to-demand
 */
export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await serverFetch<unknown>(
    `/admin/trainer-messages/${id}/to-demand`,
    { method: 'POST' },
  );
  return NextResponse.json(result);
}
