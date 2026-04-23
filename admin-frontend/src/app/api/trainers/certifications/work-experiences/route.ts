import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const params = new URLSearchParams();
  for (const [k, v] of searchParams.entries()) params.set(k, v);
  const result = await serverFetch<unknown>(
    `/admin/trainers/certifications/work-experiences?${params.toString()}`,
  );
  return NextResponse.json(result);
}
