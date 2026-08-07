import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

/**
 * 全站 /robots.txt（Next MetadataRoute）。
 * Content-Type 由框架生成为 text/plain；charset 由 next.config headers + nginx 强制为 utf-8。
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
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
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
