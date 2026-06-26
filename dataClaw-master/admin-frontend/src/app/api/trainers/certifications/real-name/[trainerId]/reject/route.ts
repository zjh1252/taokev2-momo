import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ trainerId: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { trainerId } = await params;
  const body = await request.json();
  const result = await serverFetch<unknown>(
    `/admin/trainers/certifications/real-name/${trainerId}/reject`,
    { method: 'PUT', body: JSON.stringify(body) },
  );
  return NextResponse.json(result);
}
