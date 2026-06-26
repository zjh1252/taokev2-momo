import { getBackendUrl } from '@/lib/backend-url';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  const formData = await request.formData();

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${getBackendUrl()}/admin/sensitive-words/import`, {
    method: 'POST',
    headers,
    body: formData
  });

  const json = await res.json();
  return NextResponse.json(json);
}
