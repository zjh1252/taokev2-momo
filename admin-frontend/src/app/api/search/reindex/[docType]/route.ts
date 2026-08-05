import { serverFetchWithStatus } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

const REINDEX_TIMEOUT_MS = 10 * 60 * 1000;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ docType: string }> }
) {
  const { docType } = await params;
  const body = await request.json().catch(() => ({}));
  const { status, body: result } = await serverFetchWithStatus<unknown>(`/admin/search/reindex/${docType}`, {
    method: 'POST',
    body: JSON.stringify(body),
    timeoutMs: REINDEX_TIMEOUT_MS
  });
  return NextResponse.json(result, { status });
}
