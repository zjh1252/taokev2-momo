import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ docType: string }> }
) {
  const { docType } = await params;
  const body = await request.json().catch(() => ({}));
  const result = await serverFetch<unknown>(`/admin/search/reindex/${docType}`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
  return NextResponse.json(result);
}
