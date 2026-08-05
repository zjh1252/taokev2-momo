import { serverFetchWithStatus } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ itemCode: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { itemCode } = await params;
  const body = await request.json();
  const { status, body: result } = await serverFetchWithStatus<unknown>(
    `/admin/footer/links/${encodeURIComponent(itemCode)}`,
    { method: 'PUT', body: JSON.stringify(body) }
  );
  return NextResponse.json(result, { status: status >= 400 ? status : 200 });
}
