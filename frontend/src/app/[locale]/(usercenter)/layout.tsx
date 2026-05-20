import { AppFooter } from '@/components/layout/app-footer';
import { FloatingActions } from '@/components/layout/floating-actions';
import { UserCenterHeader } from '@/features/user-center/components/user-center-header';
import { UserCenterSidebar } from '@/features/user-center/components/user-center-sidebar';
import { UserCenterBreadcrumb } from '@/features/user-center/components/user-center-breadcrumb';

/**
 * 用户中心布局 — 红色 Header + 面包屑 + 侧边栏 + 内容区 + 公共 Footer
 *
 * @author Fangxinxin
 * @date 2026-04-03 10:00
 */
export default function UserCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: 接入 AuthGuard，未登录 redirect 到 /login

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fc]">
      <UserCenterHeader />
      <UserCenterBreadcrumb />
      <main className="max-w-[1200px] w-full mx-auto px-4 pb-12 flex flex-col md:flex-row gap-6 flex-1">
        <UserCenterSidebar />
        <div className="flex-1 min-w-0 flex flex-col gap-6">{children}</div>
      </main>
      <AppFooter />
      {/* 右侧悬浮工具栏：回到顶部 / 电话 / 智能客服 / 发布需求 — 用户中心同样展示 */}
      <FloatingActions />
    </div>
  );
}
