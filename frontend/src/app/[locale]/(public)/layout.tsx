import { TopNavBar } from '@/components/layout/top-nav-bar';
import { AppHeader } from '@/components/layout/app-header';
import { AppFooter } from '@/components/layout/app-footer';
import { FloatingActions } from '@/components/layout/floating-actions';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNavBar />
      <AppHeader />
      <main className="flex-1 bg-[var(--page-bg)]">{children}</main>
      <AppFooter />
      {/* 右侧悬浮工具栏：回到顶部 / 电话 / 智能客服 / 发布需求 — 仅 public 页面 */}
      <FloatingActions />
    </>
  );
}
