import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ path: string[] }> };

function backendPath(request: NextRequest, path: string[]) {
  const query = request.nextUrl.searchParams.toString();
  const suffix = path.join('/');
  return `/admin/crawl/${suffix}${query ? `?${query}` : ''}`;
}

async function readBody(request: NextRequest) {
  const text = await request.text();
  return text ? text : undefined;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { path } = await params;
  const result = await serverFetch<unknown>(backendPath(request, path));
  return NextResponse.json(result);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { path } = await params;
  const result = await serverFetch<unknown>(backendPath(request, path), {
    method: 'POST',
    body: await readBody(request)
  });
  return NextResponse.json(result);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { path } = await params;
  const result = await serverFetch<unknown>(backendPath(request, path), {
    method: 'PUT',
    body: await readBody(request)
  });
  return NextResponse.json(result);
}
