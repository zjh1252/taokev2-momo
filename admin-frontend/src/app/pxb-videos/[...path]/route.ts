import { NextRequest, NextResponse } from 'next/server';

const PXB_CDN_BASE = (
  process.env.NEXT_PUBLIC_PXB_VIDEO_CDN_URL ?? 'https://cdn5-pxb-videos.taoke.com'
).replace(/\/+$/, '');

const PASSTHROUGH_HEADERS = [
  'content-type',
  'content-length',
  'content-range',
  'accept-ranges',
  'etag',
  'last-modified'
] as const;

/**
 * 本地 dev PXB CDN 反代（图片/视频上传资源）。
 * 浏览器直连 CDN 会带 Referer=localhost 导致 403；服务端拉流不带 Referer。
 */
async function proxyPxbAsset(request: NextRequest, pathSegments: string[]) {
  const upstreamPath = pathSegments.join('/');
  const upstream = `${PXB_CDN_BASE}/${upstreamPath}${request.nextUrl.search}`;

  const upstreamHeaders = new Headers();
  const range = request.headers.get('range');
  if (range) upstreamHeaders.set('Range', range);

  const upstreamResp = await fetch(upstream, {
    method: request.method,
    headers: upstreamHeaders,
    redirect: 'follow'
  });

  const headers = new Headers();
  for (const key of PASSTHROUGH_HEADERS) {
    const value = upstreamResp.headers.get(key);
    if (value) headers.set(key, value);
  }
  headers.set('Cache-Control', 'public, max-age=3600');

  if (request.method === 'HEAD') {
    return new NextResponse(null, { status: upstreamResp.status, headers });
  }

  return new NextResponse(upstreamResp.body, {
    status: upstreamResp.status,
    headers
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyPxbAsset(request, path);
}

export async function HEAD(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyPxbAsset(request, path);
}
