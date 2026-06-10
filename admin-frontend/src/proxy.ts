import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/about', '/privacy-policy', '/terms-of-service'];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get('access_token')?.value;

  // 未登录访问受保护页面 → 跳登录
  if (!accessToken && !isPublicPath(pathname) && pathname !== '/') {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 已登录访问登录/注册页 → 跳 dashboard
  if (accessToken && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // 根路径重定向
  if (pathname === '/') {
    const target = accessToken ? '/dashboard' : '/login';
    return NextResponse.redirect(new URL(target, req.url));
  }

  return NextResponse.next();
}

// 排除 /api、/_next、静态资源，避免 proxy 干扰嵌套 Route Handler（如 /api/auth/login）
export const config = {
  matcher: [
    '/((?!api|_next|trpc|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'
  ]
};
