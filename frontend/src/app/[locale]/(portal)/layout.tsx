import { AppHeader } from '@/components/layout/app-header';
import { AppFooter } from '@/components/layout/app-footer';
// TODO: 接入 AuthGuard，未登录 redirect 到 /login

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // TODO: await AuthGuard();

  return (
    <>
      <AppHeader />
      <main className="flex-1">{children}</main>
      <AppFooter />
    </>
  );
}
