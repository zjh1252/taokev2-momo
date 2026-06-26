import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ userId: string }> };

export async function PUT(_request: NextRequest, { params }: Params) {
  const { userId } = await params;
  const result = await serverFetch<unknown>(
    `/admin/institutions/applications/${userId}/approve`,
    { method: 'PUT' }
  );
  return NextResponse.json(result);
}
