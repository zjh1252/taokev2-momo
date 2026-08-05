import { serverFetchWithStatus } from '@/lib/server-fetch';
import { NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const payload = await request.json();
  const { status, body } = await serverFetchWithStatus<unknown>(
    `/admin/alliance/lecturers721/applications/${id}/reject`,
    {
      method: 'PUT',
      body: JSON.stringify(payload)
    }
  );
  return NextResponse.json(body, { status });
}
