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
    <>
      {/* 不用 100vw：含滚动条/刘海时会比 100% 更宽，本身会制造横向滚动 */}
      <div className="w-full max-w-full min-w-0 overflow-x-clip">
        <PublicHeader />
        <main className="min-w-0 flex-1 bg-[var(--page-bg)]">{children}</main>
        <AppFooter />
      </div>
      {/* 悬浮条置于裁剪容器外，避免 fixed + overflow 在 iOS 上异常扩宽 */}
      <FloatingActions />
    </>
  );
}
