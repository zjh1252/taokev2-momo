import { serverFetchWithStatus } from '@/lib/server-fetch';

import { NextRequest, NextResponse } from 'next/server';



export async function GET(request: NextRequest) {

  const { searchParams } = request.nextUrl;

  const resourceType = searchParams.get('resourceType');

  const params = new URLSearchParams();

  if (resourceType) params.set('resourceType', resourceType);

  const qs = params.toString();

  const { status, body } = await serverFetchWithStatus<unknown>(

    `/admin/recommendations/slots${qs ? `?${qs}` : ''}`

  );

  return NextResponse.json(body, { status: status >= 400 ? status : 200 });

}

