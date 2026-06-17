import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ indexName: string }> }
) {
  const { indexName } = await params;
  const result = await serverFetch<unknown>(
    `/admin/search/indices/${indexName}/mapping`,
    { method: 'PUT' }
  );
  return NextResponse.json(result);
}
