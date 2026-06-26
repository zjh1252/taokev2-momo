import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const page = searchParams.get('page') ?? '1';
  const size = searchParams.get('limit') ?? '20';
  const status = searchParams.get('status') ?? '';
  const reviewScope = searchParams.get('reviewScope') ?? '';
  const reviewerKeyword = searchParams.get('reviewerKeyword') ?? '';
  const reviewedBy = searchParams.get('reviewedBy') ?? '';

  const params = new URLSearchParams({ page, size });
  if (status) params.set('status', status);
  if (reviewScope) params.set('reviewScope', reviewScope);
  if (reviewerKeyword) params.set('reviewerKeyword', reviewerKeyword);
  if (reviewedBy) params.set('reviewedBy', reviewedBy);

  try {
    const result = await serverFetch<unknown>(
      `/admin/training-reviews?${params.toString()}`
    );
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : '无法连接后端或请求失败';
    return NextResponse.json(
      {
        code: 502,
        message,
        data: {
          list: [],
          total: 0,
          page: Number(page) || 1,
          size: Number(size) || 20,
          totalPages: 0
        }
      },
      { status: 502 }
    );
  }
}
