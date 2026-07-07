import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function PUT(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await serverFetch<unknown>(
    `/admin/enterprise-buyers/certifications/work-experiences/${id}/approve`,
    { method: 'PUT' }
  );
  return NextResponse.json(result);
}
