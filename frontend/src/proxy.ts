import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { NextResponse, NextRequest } from 'next/server';
import { PXB_EMBED_HEADER, PXB_ORIGIN_VALUE } from '@/lib/pxb-embed';

const intlMiddleware = createMiddleware(routing);

function pxbEmbedRequestHeaders(request: NextRequest): Headers {
  const requestHeaders = new Headers(request.headers);
  if (request.nextUrl.searchParams.get('origin') === PXB_ORIGIN_VALUE) {
    requestHeaders.set(PXB_EMBED_HEADER, '1');
  }
  return requestHeaders;
}

function rewriteKeepingQuery(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.rewrite(url, {
    request: { headers: pxbEmbedRequestHeaders(request) },
  });
}

function runIntlMiddleware(request: NextRequest) {
  const headers = pxbEmbedRequestHeaders(request);
  return intlMiddleware(
    new NextRequest(request.url, {
      headers,
    }),
  );
}

/**
 * proxy: 所有频道页和详情页 SEO URL 用 rewrite 内部转换，
 * 浏览器地址栏始终保持去 s + .htm 格式，与老站完全一致。
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = request.cookies.get('NEXT_LOCALE')?.value || 'zh-CN';

  // 老站录播播放页: /video_play/17946.htm → /videos/17946/play
  const videoPlayMatch = pathname.match(/^\/video_play\/(\d+)(?:\.htm)?$/);
  if (videoPlayMatch) {
    return rewriteKeepingQuery(
      request,
      `/${locale}/videos/${videoPlayMatch[1]}/play`,
    );
  }

  // 城市频道 SEO: /city/shanghai → /zh-CN/cities/shanghai
  const cityHomeMatch = pathname.match(/^\/city\/([a-z0-9-]+)$/);
  if (cityHomeMatch) {
    return rewriteKeepingQuery(request, `/${locale}/cities/${cityHomeMatch[1]}`);
  }

  // 城市子频道: /city/shanghai/opencourse → /zh-CN/city/shanghai/opencourse
  const citySubMatch = pathname.match(/^\/city\/([a-z0-9-]+)\/(opencourse|institutions|trainers)$/);
  if (citySubMatch) {
    return rewriteKeepingQuery(
      request,
      `/${locale}/city/${citySubMatch[1]}/${citySubMatch[2]}`,
    );
  }

  // 培训宝 iframe：/company/list.htm → 机构列表
  if (pathname === '/company/list.htm') {
    return rewriteKeepingQuery(request, `/${locale}/institutions`);
  }

  // 去s → 带s 内部路由映射
  const map: Record<string, string> = {
    '/trainer': '/trainers',
    '/opencourse': '/opencourses',
    '/inhousecourse': '/innercourses',
    '/company': '/institutions',
    '/vedio': '/videos',
    '/video': '/videos',
    '/association': '/associations',
  };

  // 精确匹配频道页: /trainer → rewrite → /zh-CN/trainers (地址栏不变，保留 query)
  if (map[pathname]) {
    return rewriteKeepingQuery(request, `/${locale}${map[pathname]}`);
  }

  // 案例详情: /case/123(.htm) → /zh-CN/cases/123
  const caseMatch = pathname.match(/^\/case\/(\d+)(?:\.htm)?$/);
  if (caseMatch) {
    return NextResponse.rewrite(
      new URL(`/${locale}/cases/${caseMatch[1]}`, request.url),
    );
  }

  // 公开课开课计划详情: /opencourse/TK-000015-1(.htm) → /zh-CN/opencourses/plan/TK-000015-1
  if (pathname.startsWith('/opencourse/TK-')) {
    const raw = pathname.slice('/opencourse/'.length).replace(/\.htm$/, '');
    return NextResponse.rewrite(
      new URL(`/${locale}/opencourses/plan/${encodeURIComponent(raw)}`, request.url),
    );
  }

  // 详情页去s: /trainer/123(.htm) → rewrite → /zh-CN/trainers/123
  for (const [oldBase, newBase] of Object.entries(map)) {
    if (pathname.startsWith(`${oldBase}/`)) {
      const suffix = pathname.slice(oldBase.length);
      // /trainer/123/course.htm → 308 → /trainer/123/courses.htm（旧版单数重定向）
      if (oldBase === '/trainer') {
        const oldSlugMatch = suffix.match(/^\/(\d+)\/(course|case)\.htm$/);
        if (oldSlugMatch) {
          const newSlug = oldSlugMatch[2] === 'course' ? 'courses' : 'cases';
          return NextResponse.redirect(
            new URL(`/trainer/${oldSlugMatch[1]}/${newSlug}.htm`, request.url),
            308,
          );
        }
      }
      // /trainer/123/courses.htm → rewrite → /zh-CN/trainers/123/courses
      if (
        oldBase === '/trainer'
        && /^\/\d+\/(courses|cases|video|comment|book)\.htm$/.test(suffix)
      ) {
        const match = suffix.match(/^\/(\d+)\/(courses|cases|video|comment|book)\.htm$/);
        if (match) {
          return NextResponse.rewrite(
            new URL(`/${locale}${newBase}/${match[1]}/${match[2]}`, request.url),
          );
        }
      }
      // /video/123/play → rewrite → /zh-CN/videos/123/play
      if (/^\/\d+\/play$/.test(suffix)) {
        return NextResponse.rewrite(
          new URL(`/${locale}${newBase}${suffix}`, request.url),
        );
      }
      // /trainer/123.htm → rewrite (地址栏不变!)
      if (/^\/\d+\.htm$/.test(suffix)) {
        return NextResponse.rewrite(
          new URL(`/${locale}${newBase}/${suffix.slice(1, -4)}`, request.url),
        );
      }
      // /trainer/123 → rewrite (地址栏不变!)
      if (/^\/\d+$/.test(suffix)) {
        return NextResponse.rewrite(
          new URL(`/${locale}${newBase}${suffix}`, request.url),
        );
      }
      // 筛选.htm → rewrite → /zh-CN/trainers?slug=...
      if (suffix.endsWith('.htm') && oldBase === '/trainer') {
        return NextResponse.rewrite(
          new URL(`/${locale}/trainers?slug=${encodeURIComponent(suffix.slice(1, -4))}`, request.url),
        );
      }
    }
  }

  return runIntlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!_next|api|uploads|pxb-videos|taoke-legacy|pxb-legacy|statics|tac|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|ico|webp|avif|css|js|woff|woff2|ttf|eot|json|xml|txt|map|mp4|m4v|webm)).*)',
  ],
};
