import { serverFetchWithStatus } from '@/lib/server-fetch';
import { NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { status, body } = await serverFetchWithStatus<unknown>(
    `/admin/alliance/lecturers721/applications/${id}/approve`,
    { method: 'PUT' }
  );
  return NextResponse.json(body, { status });
}
