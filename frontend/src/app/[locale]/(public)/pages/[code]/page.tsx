import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublishedStaticPage } from '@/features/footer/api/service';

type PageProps = {
  params: Promise<{ code: string; locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const page = await getPublishedStaticPage(code);
  if (!page) {
    return { title: '页面不存在 - 淘课网' };
  }
  return {
    title: `${page.title} - 淘课网`,
    description: page.title
  };
}

export default async function StaticCmsPage({ params }: PageProps) {
  const { code } = await params;
  const page = await getPublishedStaticPage(code);
  if (!page) {
    notFound();
  }

  return (
    <div className='container mx-auto max-w-4xl px-6 py-12'>
      <h1 className='mb-8 text-3xl font-bold text-foreground'>{page.title}</h1>
      <article
        className='prose prose-neutral max-w-none dark:prose-invert'
        dangerouslySetInnerHTML={{ __html: page.content ?? '' }}
      />
    </div>
  );
}
