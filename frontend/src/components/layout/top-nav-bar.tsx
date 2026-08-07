'use client';

import { HeaderUserActions } from './header-user-actions';

/** 集团产品矩阵链接 */
const GROUP_LINKS = [
  { label: '淘课集团', href: 'https://www.taoke.com.cn/' },
  { label: '培训宝', href: 'https://www.91pxb.com/' },
  { label: '目标通', href: 'https://www.91mbt.com/' },
  { label: 'AI 导师', href: 'https://a23880.91pxb.com/pc_elearning/#/ai/mentor/604996/list' },
  { label: '智能创导', href: 'https://a23880.91pxb.com/pc_elearning/#/ai/extraction/604996' },
  { label: 'AI 陪练', href: 'https://a23880.91pxb.com/pc_elearning/#/ai/training_partner/604996/list' },
] as const;

/**
 * 顶部辅助导航栏 — 集团产品矩阵 + 用户认证区域
 * <p>
 * 右侧：已登录显示购物车 + 通知 + 用户区域；未登录仅显示"登录/注册"。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:05
 */
export function TopNavBar() {
  return (
    <div className="sticky top-0 z-50 w-full max-w-full overflow-x-clip border-b border-slate-100 bg-slate-50 px-3 py-1.5 text-xs sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl min-w-0 items-center justify-between gap-2">
        {/* 左侧：集团站点（窄屏内部横滚，不撑开整页） */}
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto overscroll-x-contain text-slate-500 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {GROUP_LINKS.map((link, i) => (
            <span key={link.label} className="flex shrink-0 items-center gap-3">
              {i > 0 && <span className="text-slate-300">|</span>}
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="whitespace-nowrap transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            </span>
          ))}
        </div>

        <div className="shrink-0">
          <HeaderUserActions />
        </div>
      </div>
    </div>
  );
}
