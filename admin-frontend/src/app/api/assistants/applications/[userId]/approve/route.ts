import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const result = await serverFetch<unknown>(
    `/admin/assistants/applications/${userId}/approve`,
    { method: 'PUT' }
  );
  return NextResponse.json(result);
}
