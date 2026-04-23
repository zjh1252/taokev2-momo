import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ trainerId: string }> };

export async function PUT(_request: NextRequest, { params }: Params) {
  const { trainerId } = await params;
  const result = await serverFetch<unknown>(
    `/admin/trainers/certifications/real-name/${trainerId}/approve`,
    { method: 'PUT' },
  );
  return NextResponse.json(result);
}
