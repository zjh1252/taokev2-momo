import { TopNavBar } from '@/components/layout/top-nav-bar';
import { AppHeader } from '@/components/layout/app-header';
import { AppFooter } from '@/components/layout/app-footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNavBar />
      <AppHeader />
      <main className="flex-1 bg-[var(--page-bg)]">{children}</main>
      <AppFooter />
    </>
  );
}
