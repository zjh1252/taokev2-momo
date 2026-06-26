import { serverFetchWithStatus } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ slotCode: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { slotCode } = await params;
  const { status, body } = await serverFetchWithStatus<unknown>(
    `/admin/recommendations/slots/${encodeURIComponent(slotCode)}/config`
  );
  return NextResponse.json(body, { status: status >= 400 ? status : 200 });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { slotCode } = await params;
  const body = await request.json();
  const { status, body: result } = await serverFetchWithStatus<unknown>(
    `/admin/recommendations/slots/${encodeURIComponent(slotCode)}/config`,
    { method: 'PUT', body: JSON.stringify(body) }
  );
  return NextResponse.json(result, { status: status >= 400 ? status : 200 });
}
