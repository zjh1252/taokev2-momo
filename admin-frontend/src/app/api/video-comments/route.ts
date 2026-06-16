import { serverFetch } from '@/lib/server-fetch';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const params = new URLSearchParams();
  params.set('page', searchParams.get('page') ?? '1');
  params.set('size', searchParams.get('size') ?? '10');

  const videoTitle = searchParams.get('videoTitle');
  const commentUser = searchParams.get('commentUser');
  const keyword = [videoTitle, commentUser].filter(Boolean).join(' ').trim();
  if (keyword) params.set('keyword', keyword);
  const auditStatus = searchParams.get('auditStatus');
  if (auditStatus) params.set('auditStatus', auditStatus);

  const result = await serverFetch<unknown>(
    `/admin/video-comments?${params.toString()}`
  );
  return NextResponse.json(result);
}
