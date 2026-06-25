import { headers } from 'next/headers';
import { TopNavBar } from '@/components/layout/top-nav-bar';
import { AppHeader } from '@/components/layout/app-header';
import { AppFooter } from '@/components/layout/app-footer';
import { FloatingActions } from '@/components/layout/floating-actions';
import { PxbEmbedProvider } from '@/components/pxb-embed/pxb-embed-provider';
import { PXB_EMBED_HEADER } from '@/lib/pxb-embed';
import '@/styles/pxb-embed.css';
import '@/styles/pxb-course-list.css';
import '@/styles/pxb-trainer-list.css';
import '@/styles/pxb-institution-list.css';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const isPxbEmbed = (await headers()).get(PXB_EMBED_HEADER) === '1';

  if (isPxbEmbed) {
    return (
      <PxbEmbedProvider enabled>
        <main className="pxb-embed-main">{children}</main>
      </PxbEmbedProvider>
    );
  }

  return (
    <>
      <TopNavBar />
      <AppHeader />
      <main className="flex-1 bg-[var(--page-bg)]">{children}</main>
      <AppFooter />
      <FloatingActions />
    </>
  );
}
