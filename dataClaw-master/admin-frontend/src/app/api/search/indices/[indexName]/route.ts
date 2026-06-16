import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ indexName: string }> }
) {
  const { indexName } = await params;
  const result = await serverFetch<unknown>(`/admin/search/indices/${indexName}`, {
    method: 'DELETE'
  });
  return NextResponse.json(result);
}
