import { serverFetchWithStatus } from '@/lib/server-fetch';

import { NextRequest, NextResponse } from 'next/server';



export async function GET(request: NextRequest) {

  const { searchParams } = request.nextUrl;

  const slotCode = searchParams.get('slotCode');

  if (!slotCode) {

    return NextResponse.json({ code: 400, message: 'slotCode is required' }, { status: 400 });

  }

  const categoryId = searchParams.get('categoryId');

  const params = new URLSearchParams({ slotCode });

  if (categoryId) params.set('categoryId', categoryId);

  const { status, body } = await serverFetchWithStatus<unknown>(

    `/admin/recommendations?${params.toString()}`

  );

  return NextResponse.json(body, { status: status >= 400 ? status : 200 });

}



export async function POST(request: NextRequest) {

  const body = await request.json();

  const { status, body: result } = await serverFetchWithStatus<unknown>('/admin/recommendations', {

    method: 'POST',

    body: JSON.stringify(body)

  });

  return NextResponse.json(result, { status: status >= 400 ? status : 200 });

}

