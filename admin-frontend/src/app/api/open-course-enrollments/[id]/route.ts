import { serverFetchWithStatus } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

/**
 * 公开课报名详情 / 更新 BFF
 *
 * @author Fangxinxin
 * @date 2026-08-06 20:30
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await serverFetchWithStatus<unknown>(
    `/admin/open-course-enrollments/${id}`,
  );
  return NextResponse.json(result.body, { status: result.status });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const result = await serverFetchWithStatus<unknown>(
    `/admin/open-course-enrollments/${id}`,
    { method: 'PUT', body: JSON.stringify(body) },
  );
  return NextResponse.json(result.body, { status: result.status });
}
