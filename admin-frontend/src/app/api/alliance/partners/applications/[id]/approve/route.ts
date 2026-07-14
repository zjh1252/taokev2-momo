import { serverFetchWithStatus } from '@/lib/server-fetch';
import { NextResponse } from 'next/server';

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status, body } = await serverFetchWithStatus<unknown>(
    `/admin/alliance/partners/applications/${id}/approve`,
    { method: 'PUT' }
  );
  return NextResponse.json(body, { status });
}
