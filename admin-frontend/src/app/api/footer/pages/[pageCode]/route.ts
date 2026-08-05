import { serverFetchWithStatus } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ pageCode: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { pageCode } = await params;
  const { status, body } = await serverFetchWithStatus<unknown>(
    `/admin/footer/pages/${encodeURIComponent(pageCode)}`
  );
  return NextResponse.json(body, { status: status >= 400 ? status : 200 });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { pageCode } = await params;
  const body = await request.json();
  const { status, body: result } = await serverFetchWithStatus<unknown>(
    `/admin/footer/pages/${encodeURIComponent(pageCode)}`,
    { method: 'PUT', body: JSON.stringify(body) }
  );
  return NextResponse.json(result, { status: status >= 400 ? status : 200 });
}
