import { headers } from 'next/headers';
import { PublicHeader } from '@/components/layout/public-header';
import { AppFooter } from '@/components/layout/app-footer';
import { FloatingActions } from '@/components/layout/floating-actions';
import { PxbEmbedProvider } from '@/components/pxb-embed/pxb-embed-provider';
import { PXB_EMBED_HEADER } from '@/lib/pxb-embed';
import '@/styles/pxb-embed.css';
import '@/styles/pxb-course-list.css';
import '@/styles/pxb-trainer-list.css';
import '@/styles/pxb-institution-list.css';
import '@/styles/pxb-demand-form.css';

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
    <div className="w-full overflow-x-auto">
      <div className="min-w-0">
        <PublicHeader />
        <main className="flex-1 bg-[var(--page-bg)]">{children}</main>
        <AppFooter />
      </div>
      <FloatingActions />
    </div>
  );
}
