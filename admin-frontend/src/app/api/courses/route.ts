import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const page = searchParams.get('page') ?? '1';
  const size = searchParams.get('limit') ?? '10';
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const type = searchParams.get('type') ?? '';
  const trainerId = searchParams.get('trainerId') ?? '';
  const publisherType = searchParams.get('publisherType') ?? '';
  const publisherId = searchParams.get('publisherId') ?? '';
  const publisherName = searchParams.get('publisherName') ?? '';

  const params = new URLSearchParams({ page, size });
  if (search) params.set('keyword', search);
  if (status) params.set('status', status);
  if (type) params.set('type', type);
  if (trainerId) params.set('trainerId', trainerId);
  if (publisherType) params.set('publisherType', publisherType);
  if (publisherId) params.set('publisherId', publisherId);
  if (publisherName) params.set('publisherName', publisherName);

  const result = await serverFetch<unknown>(
    `/admin/courses?${params.toString()}`
  );
  return NextResponse.json(result);
}
