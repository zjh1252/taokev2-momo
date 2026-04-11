import { serverFetch } from '@/lib/server-fetch';
import { NextResponse } from 'next/server';

export async function POST() {
  const result = await serverFetch<unknown>(
    '/admin/sensitive-words/reload',
    { method: 'POST' }
  );
  return NextResponse.json(result);
}
