import { siteConfig } from '@/config/site';

const DISALLOW_PATHS = [
  '/admin/',
  '/teacher/backend/',
  '/login',
  '/register',
  '/forgot-password',
  '/cart',
  '/checkout',
  '/dashboard/',
  '/usercenter/',
  '/myorder/',
  '/search',
  '/submit-success',
  '/404',
];

export const dynamic = 'force-static';

export function GET() {
  const body = [
    'User-agent: *',
    'Allow: /',
    ...DISALLOW_PATHS.map((path) => `Disallow: ${path}`),
    `Sitemap: ${siteConfig.url}/sitemap.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
