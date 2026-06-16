import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const page = searchParams.get('page') ?? '1';
  const size = searchParams.get('limit') ?? '10';
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const role = searchParams.get('role') ?? '';
  const regOrigin = searchParams.get('regOrigin') ?? '';
  const realNameCertStatus = searchParams.get('realNameCertStatus') ?? '';

  const params = new URLSearchParams({ page, size });
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  if (role) params.set('role', role);
  if (regOrigin) params.set('regOrigin', regOrigin);
  if (realNameCertStatus) params.set('realNameCertStatus', realNameCertStatus);

  const result = await serverFetch<unknown>(`/admin/users?${params.toString()}`);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await serverFetch<unknown>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  return NextResponse.json(result);
}
