import { serverFetchWithStatus } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const params = new URLSearchParams();
  const page = request.nextUrl.searchParams.get('page');
  const size = request.nextUrl.searchParams.get('size');
  const statusFilter = request.nextUrl.searchParams.get('status');

  if (page) params.set('page', page);
  if (size) params.set('size', size);
  if (statusFilter) params.set('status', statusFilter);

  const query = params.toString();
  const { status, body } = await serverFetchWithStatus<unknown>(
    `/admin/alliance/lecturers721/applications${query ? `?${query}` : ''}`
  );
  return NextResponse.json(body, { status });
}
