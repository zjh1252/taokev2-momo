'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { ArrowUp, Phone, Headphones, MessageSquarePlus, Copy, Check } from 'lucide-react';
import { CustomerServiceChatDialog } from '@/components/customer-service-chat-dialog';
import { useAuth } from '@/lib/auth/auth-context';

/** 平台客服电话 */
const SERVICE_PHONE = '021-34606062';

/**
 * 右侧悬浮工具栏 — 回到顶部 / 电话 / 智能客服 / 发布需求
 *
 * <p>挂在 (public) 与 (usercenter) layout，所有非鉴权页面右侧常驻。</p>
 * <ul>
 *   <li>回到顶部：常驻显示，点击平滑滚动到顶部</li>
 *   <li>电话：hover 显示气泡，气泡内可一键复制号码</li>
 *   <li>智能客服：唤起培训宝智能客服（iframe 弹窗）</li>
 *   <li>发布需求：未登录 → /publish-demand，已登录 → /dashboard/demands/create</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-05-20 16:30
 */
export function FloatingActions() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(SERVICE_PHONE);
      setPhoneCopied(true);
      setTimeout(() => setPhoneCopied(false), 2000);
    } catch {
      // 浏览器无 clipboard 权限时降级：选中提示
      window.prompt('请手动复制客服电话：', SERVICE_PHONE);
    }
  };

  const gotoPublishDemand = () => {
    if (loading) return;
    router.push(user ? ROUTES.UC_DEMANDS_CREATE : ROUTES.PUBLISH_DEMAND);
  };

  // 普通按钮 hover：底色加深 + 图标&文字变主色 + 轻微上移
  const itemBase =
    'group flex flex-col items-center justify-center gap-0.5 py-2 cursor-pointer transition-all duration-150 hover:bg-primary/5 hover:-translate-y-[1px] sm:gap-1 sm:py-3';
  const iconBase = 'size-4 text-slate-600 group-hover:text-primary transition-colors sm:size-5';
  const labelBase = 'text-[10px] leading-tight text-slate-600 group-hover:text-primary transition-colors sm:text-[11px]';

  return (
    <>
      <aside
        aria-label="quick-actions"
        className="fixed right-2 bottom-16 z-30 flex w-[58px] max-w-[calc(100vw-16px)] flex-col items-stretch overflow-visible rounded-xl border border-slate-100 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] sm:right-4 sm:bottom-24 sm:w-[72px]"
      >
      {/* 回到顶部 — 常驻显示，hover 上抬 */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="回到顶部"
        className={`${itemBase} border-b border-slate-100`}
      >
        <ArrowUp className={iconBase} />
        <span className={labelBase}>回到顶部</span>
      </button>

      {/* 电话 — hover 显示气泡 */}
      <div
        className={`group/phone relative ${itemBase} border-b border-slate-100`}
      >
        <Phone className="size-4 text-slate-600 group-hover/phone:text-primary transition-colors sm:size-5" />
        <span className="text-[10px] leading-tight text-slate-600 group-hover/phone:text-primary transition-colors sm:text-[11px]">
          电话
        </span>

        {/* hover 气泡 */}
        <div className="invisible group-hover/phone:visible absolute right-[calc(100%+8px)] top-1/2 flex w-[min(220px,calc(100vw-86px))] -translate-y-1/2 flex-col items-stretch gap-2 rounded-xl border border-slate-100 bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)] sm:right-[calc(100%+10px)]">
          <div className="text-xs text-slate-500">客服电话</div>
          <div className="text-base font-semibold text-slate-900 tracking-wide">
            {SERVICE_PHONE}
          </div>
          <button
            type="button"
            onClick={copyPhone}
            className="mt-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors cursor-pointer"
          >
            {phoneCopied ? (
              <>
                <Check className="size-3.5" />
                已复制
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                点击复制
              </>
            )}
          </button>
          {/* 三角箭头 */}
          <span className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 bg-white border-r border-b border-slate-100" />
        </div>
      </div>

      {/* 智能客服 */}
      <button
        type="button"
        onClick={() => setChatOpen(true)}
        aria-label="智能客服"
        className={`${itemBase} border-b border-slate-100`}
      >
        <Headphones className={iconBase} />
        <span className={labelBase}>在线客服</span>
      </button>

      {/* 发布需求 — 主色调按钮，hover 颜色加深 */}
      <button
        type="button"
        onClick={gotoPublishDemand}
        aria-label="发布需求"
        className="group flex flex-col items-center justify-center gap-0.5 bg-primary/5 py-2 transition-all duration-150 cursor-pointer hover:-translate-y-[1px] hover:bg-primary/15 sm:gap-1 sm:py-3"
      >
        <MessageSquarePlus className="size-4 text-primary transition-transform group-hover:scale-110 sm:size-5" />
        <span className="text-[10px] font-medium leading-tight text-primary sm:text-[11px]">发布需求</span>
      </button>
      </aside>
      <CustomerServiceChatDialog open={chatOpen} onOpenChange={setChatOpen} />
    </>
  );
}
