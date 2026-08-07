'use client';

import { useState } from 'react';
import { PanelLeft } from 'lucide-react';
import { AppFooter } from '@/components/layout/app-footer';
import { FloatingActions } from '@/components/layout/floating-actions';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { UserCenterHeader } from '@/features/user-center/components/user-center-header';
import { UserCenterSidebar } from '@/features/user-center/components/user-center-sidebar';
import { UserCenterBreadcrumb } from '@/features/user-center/components/user-center-breadcrumb';
import { DashboardAuthGuard } from '@/features/user-center/components/dashboard-auth-guard';

/**
 * 用户中心布局 — Header + 面包屑 + 侧边栏 + 内容区 + Footer
 *
 * <p>移动端：单列流式；左侧菜单收纳为抽屉，禁止常驻分栏撑破视口。</p>
 * <p>桌面端：保留左右分栏。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-03 10:00
 */
export default function UserCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAuthGuard>
      <div className="flex min-h-screen max-w-full flex-col overflow-x-clip bg-[#f7f9fc]">
        <UserCenterHeader />
        <UserCenterBreadcrumb />
        <main className="mx-auto flex w-full min-w-0 max-w-[1200px] flex-1 flex-col gap-4 px-4 pb-12 lg:flex-row lg:gap-6">
          <MobileUserCenterMenu />
          <div className="hidden shrink-0 lg:block">
            <UserCenterSidebar />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-6">{children}</div>
        </main>
        <AppFooter />
        <FloatingActions />
      </div>
    </DashboardAuthGuard>
  );
}

function MobileUserCenterMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm"
      >
        <PanelLeft className="size-4" />
        用户中心菜单
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[86vw] max-w-[320px] gap-0 overflow-y-auto p-0">
          <SheetHeader className="border-b border-slate-100 px-4 py-3">
            <SheetTitle>用户中心菜单</SheetTitle>
          </SheetHeader>
          <div className="p-3">
            <UserCenterSidebar onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
