import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 公开课报名列表 BFF
 *
 * @author Fangxinxin
 * @date 2026-08-06 20:30
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = searchParams.get('page') ?? '1';
  const size = searchParams.get('limit') ?? '20';
  const status = searchParams.get('status') ?? '';
  const keyword = searchParams.get('keyword') ?? '';
  const createdFrom = searchParams.get('createdFrom') ?? '';
  const createdTo = searchParams.get('createdTo') ?? '';

  const params = new URLSearchParams({ page, size });
  if (status) params.set('status', status);
  if (keyword) params.set('keyword', keyword);
  if (createdFrom) params.set('createdFrom', createdFrom);
  if (createdTo) params.set('createdTo', createdTo);

  const result = await serverFetch<unknown>(
    `/admin/open-course-enrollments?${params.toString()}`,
  );
  return NextResponse.json(result);
}
