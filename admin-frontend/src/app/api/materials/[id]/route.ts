import { serverFetchWithStatus } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { status, body: result } = await serverFetchWithStatus<unknown>(
    `/admin/materials/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(body)
    }
  );
  return NextResponse.json(result, { status });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { status, body: result } = await serverFetchWithStatus<unknown>(
    `/admin/materials/${id}`,
    {
      method: 'DELETE'
    }
  );
  return NextResponse.json(result, { status });
}
