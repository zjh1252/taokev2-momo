import { serverFetchWithStatus } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 后台 — 驳回专家经纪公司申请。
 * <p>透传后端 HTTP status，便于前端在 onError 中看到 404/400 等业务错误。</p>
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const requestBody = await request.json();
  const { status, body } = await serverFetchWithStatus<unknown>(
    `/admin/enterprise-agents/applications/${userId}/reject`,
    { method: 'PUT', body: JSON.stringify(requestBody) },
  );
  return NextResponse.json(body, { status });
}
