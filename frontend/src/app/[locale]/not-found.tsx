'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { Home, Users, BookOpen, Briefcase, Play, Building2, Handshake } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { siteConfig } from '@/config/site';

const REDIRECT_SECONDS = 10;

const CHANNELS = [
  { label: '培训专家', href: ROUTES.TRAINERS, icon: Users },
  { label: '公开课', href: ROUTES.PUBLIC_COURSES, icon: BookOpen },
  { label: '内训课', href: ROUTES.INTERNAL_COURSES, icon: Briefcase },
  { label: '录播课', href: ROUTES.ONLINE_COURSES, icon: Play },
  { label: '培训机构', href: ROUTES.INSTITUTIONS, icon: Building2 },
  { label: '培协', href: ROUTES.ASSOCIATIONS, icon: Handshake },
];

/**
 * 404 页面（locale 级兜底）— 未命中 (public) 路由组的 404 使用此页面
 * @author Fangxinxin
 * @date 2026-06-09 16:00
 */
export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  const goHome = useCallback(() => {
    router.replace(ROUTES.HOME);
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          goHome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [goHome]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* 简易顶部导航 */}
      <header className="h-[80px] w-full bg-white/90 backdrop-blur-md shadow-sm px-8 flex items-center">
        <Link href={ROUTES.HOME} className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tighter text-slate-900">
            淘课网
          </span>
        </Link>
      </header>

      {/* 404 内容 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* 主视觉 */}
        <div className="text-center mb-10">
          <p className="text-[120px] font-black text-slate-200 leading-none select-none">
            404
          </p>
          <h1 className="text-2xl font-bold text-slate-800 mt-2">
            页面没有找到
          </h1>
          <p className="text-[15px] text-slate-500 mt-3 max-w-md mx-auto leading-relaxed">
            您访问的页面不存在或已被移除，请检查网址是否正确。
            <br />
            {countdown > 0 ? (
              <span>
                <span className="text-primary font-bold text-lg">{countdown}</span>{' '}
                秒后自动返回首页
              </span>
            ) : (
              <span className="text-primary">正在跳转…</span>
            )}
          </p>
        </div>

        {/* 快捷导航 */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
          <button
            type="button"
            onClick={goHome}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Home className="size-4" />
            返回首页
          </button>
          {CHANNELS.map((ch) => (
            <Link
              key={ch.href}
              href={ch.href}
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:border-primary hover:text-primary transition-colors"
            >
              <ch.icon className="size-4" />
              {ch.label}
            </Link>
          ))}
        </div>

        {/* 淘课网介绍 */}
        <div className="max-w-3xl w-full bg-gradient-to-br from-primary/5 to-blue-50 border border-primary/10 rounded-2xl p-8 text-center">
          <h2 className="text-lg font-bold text-slate-800 mb-2">
            关于{siteConfig.name}
          </h2>
          <p className="text-[13px] text-slate-400 mb-5">企业培训师资课程推广平台</p>

          {/* 核心服务标签 */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
            {['培训机构对接', '数字化增效', 'TTT赋能'].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-[12px] rounded-full bg-white border border-primary/20 text-primary font-medium"
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="text-[15px] text-slate-600 leading-8 max-w-2xl mx-auto">
            {siteConfig.name}致力给专家讲师提供培训机构对接、数字化增效、TTT赋能等服务，让培训机构轻松找到靠谱的专家讲师并采购他们的课程，协力服务好企业买家，合作共赢。
          </p>
          <p className="text-[15px] text-slate-600 leading-8 max-w-2xl mx-auto mt-4">
            {siteConfig.name}还帮助培训机构高效推广公开课、在线课。提供一般互联网平台服务之外，还整合了中国领先的培训管理工具
            <span className="text-primary font-bold"> 培训宝</span>
            ，帮助专家讲师、培训机构全方位
            <span className="text-primary font-semibold"> 互联网+增效</span>
            ，提升竞争力！赢得更多订单！
          </p>
        </div>
      </div>
    </div>
  );
}
