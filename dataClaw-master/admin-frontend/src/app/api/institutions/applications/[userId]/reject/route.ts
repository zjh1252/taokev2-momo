import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ userId: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { userId } = await params;
  const body = await request.json();
  const result = await serverFetch<unknown>(
    `/admin/institutions/applications/${userId}/reject`,
    { method: 'PUT', body: JSON.stringify(body) }
  );
  return NextResponse.json(result);
}
