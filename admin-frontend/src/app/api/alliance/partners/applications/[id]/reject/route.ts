import { serverFetchWithStatus } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const requestBody = await request.json();
  const { status, body } = await serverFetchWithStatus<unknown>(
    `/admin/alliance/partners/applications/${id}/reject`,
    {
      method: 'PUT',
      body: JSON.stringify(requestBody)
    }
  );
  return NextResponse.json(body, { status });
}
