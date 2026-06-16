import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/lib/server-fetch';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = searchParams.get('page') ?? '1';
  const size = searchParams.get('limit') ?? '20';
  const keyword = searchParams.get('keyword') ?? searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';

  const params = new URLSearchParams({ page, size });
  if (keyword) params.set('keyword', keyword);
  if (status) params.set('status', status);

  try {
    const result = await serverFetch<unknown>(`/admin/books?${params.toString()}`);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '无法连接后端或请求失败';
    return NextResponse.json(
      { code: 502, message, data: { list: [], total: 0, page: 1, size: 20 } },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const trainerId = searchParams.get('trainerId');
  if (!trainerId) {
    return NextResponse.json(
      { code: 400, message: '缺少 trainerId 参数' },
      { status: 400 }
    );
  }
  const body = await request.json();
  const result = await serverFetch<unknown>(
    `/admin/books?trainerId=${trainerId}`,
    {
      method: 'POST',
      body: JSON.stringify(body)
    }
  );
  return NextResponse.json(result);
}
