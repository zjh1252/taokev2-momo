import type { Metadata } from 'next';
import { buildCanonicalUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: '发布培训需求 - 淘课网',
  description:
    '在淘课网发布企业培训需求，填写培训主题、人数、预算和地区信息，平台客服协助匹配合适讲师、机构与课程方案。',
  keywords: '发布培训需求, 企业内训需求, 培训讲师匹配',
  alternates: { canonical: buildCanonicalUrl('/publish-demand') },
};

export default function PublishDemandLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
