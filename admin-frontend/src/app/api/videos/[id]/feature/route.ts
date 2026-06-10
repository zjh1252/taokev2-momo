import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const type = request.nextUrl.searchParams.get('type') || 'recommend';
  const result = await serverFetch<unknown>(
    `/admin/videos/${id}/feature?type=${type}`,
    { method: 'PUT' }
  );
  return NextResponse.json(result);
}
