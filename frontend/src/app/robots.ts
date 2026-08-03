import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

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
