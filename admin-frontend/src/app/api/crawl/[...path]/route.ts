import { serverFetchWithStatus } from '@/lib/server-fetch';
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
  const { status, body } = await serverFetchWithStatus<unknown>(backendPath(request, path));
  return NextResponse.json(body, { status });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { path } = await params;
  const { status, body } = await serverFetchWithStatus<unknown>(backendPath(request, path), {
    method: 'POST',
    body: await readBody(request)
  });
  return NextResponse.json(body, { status });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { path } = await params;
  const { status, body } = await serverFetchWithStatus<unknown>(backendPath(request, path), {
    method: 'PUT',
    body: await readBody(request)
  });
  return NextResponse.json(body, { status });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { path } = await params;
  const { status, body } = await serverFetchWithStatus<unknown>(backendPath(request, path), {
    method: 'DELETE'
  });
  return NextResponse.json(body, { status });
}
