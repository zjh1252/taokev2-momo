import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

const PUBLIC_PATHS = [
  '/',
  '/trainer',
  '/opencourse',
  '/inhousecourse',
  '/video',
  '/company',
  '/association',
  '/articles',
  '/publish-demand',
  '/about/taoke',
  '/about/contact',
  '/about/careers',
  '/about/business',
  '/about/ads',
  '/about/terms',
  '/about/legal',
  '/about/privacy',
  '/about/help',
  '/about/sitemap',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PUBLIC_PATHS.map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified,
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : 0.7,
  }));
}
