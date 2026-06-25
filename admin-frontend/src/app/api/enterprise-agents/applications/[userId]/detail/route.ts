import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const result = await serverFetch<unknown>(`/admin/enterprise-agents/applications/${userId}/detail`);
  return NextResponse.json(result);
}
