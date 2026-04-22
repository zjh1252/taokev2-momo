import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const value = searchParams.get('value') ?? '0';

  const result = await serverFetch<unknown>(
    `/admin/trainers/${id}/recommend?value=${value}`,
    { method: 'PATCH' }
  );
  return NextResponse.json(result);
}
