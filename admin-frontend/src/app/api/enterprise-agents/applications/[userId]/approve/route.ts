import { serverFetchWithStatus } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 后台 — 审核通过专家经纪公司申请。
 * <p>透传后端 HTTP status，便于前端在 onError 中看到 404/400 等业务错误。</p>
 */
export async function PUT(_request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const { status, body } = await serverFetchWithStatus<unknown>(
    `/admin/enterprise-agents/applications/${userId}/approve`,
    { method: 'PUT' },
  );
  return NextResponse.json(body, { status });
}
