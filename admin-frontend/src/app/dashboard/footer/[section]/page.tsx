import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { FooterManager } from '@/features/footer/components/footer-manager';
import {
  FOOTER_SECTION_LABELS,
  footerSectionFromSlug
} from '@/features/footer/api/types';

type PageProps = {
  params: Promise<{ section: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { section: slug } = await params;
  const section = footerSectionFromSlug(slug);
  const title = section ? FOOTER_SECTION_LABELS[section] : '底部管理';
  return { title: `${title} - 底部管理` };
}

export default async function FooterSectionPage({ params }: PageProps) {
  const { section: slug } = await params;
  const section = footerSectionFromSlug(slug);
  if (!section) {
    notFound();
  }

  const title = FOOTER_SECTION_LABELS[section];

  return (
    <PageContainer
      scrollable
      pageTitle={title}
      pageDescription='管理首页底部栏展示内容与链接'
    >
      <FooterManager section={section} />
    </PageContainer>
  );
}
