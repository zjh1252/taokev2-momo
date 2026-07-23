import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AboutPageShell } from '@/features/footer/components/about-page-shell';
import { getAboutPage } from '@/features/footer/content/about-pages';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return [
    { slug: 'taoke' },
    { slug: 'contact' },
    { slug: 'careers' },
    { slug: 'business' },
    { slug: 'ads' },
    { slug: 'terms' },
    { slug: 'legal' },
    { slug: 'privacy' },
    { slug: 'help' },
    { slug: 'sitemap' },
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getAboutPage(slug);
  if (!page) {
    return { title: '页面不存在 - 淘课网' };
  }
  return {
    title: `${page.title} - 淘课网`,
    description: page.title,
  };
}

/**
 * 底部静态落地页：正文直接抄老站 about HTML
 *
 * @author Fangxinxin
 * @date 2026-07-23 16:20
 */
export default async function AboutStaticPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getAboutPage(slug);
  if (!page) {
    notFound();
  }

  return <AboutPageShell title={page.title} html={page.html} />;
}
