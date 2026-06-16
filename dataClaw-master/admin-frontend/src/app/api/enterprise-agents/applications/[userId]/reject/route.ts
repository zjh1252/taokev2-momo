import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const body = await request.json();
  const result = await serverFetch<unknown>(`/admin/enterprise-agents/applications/${userId}/reject`, { method: 'PUT', body: JSON.stringify(body) });
  return NextResponse.json(result);
}
