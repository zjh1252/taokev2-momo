'use client';

import { useEffect, useState } from 'react';

const REDIRECT_SECONDS = 10;

const CHANNEL_LINKS = [
  { label: '培训专家', href: '/trainer' },
  { label: '公开课', href: '/opencourse' },
  { label: '内训课', href: '/inhousecourse' },
  { label: '录播课', href: '/video' },
  { label: '培训机构', href: '/company' },
  { label: '培协', href: '/association' },
];

/**
 * 根级 404 倒计时与跳转（客户端逻辑）
 */
export function NotFoundContent() {
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.replace('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-slate-50 text-center">
      <p className="text-[120px] font-black text-slate-200 leading-none select-none">404</p>
      <h1 className="text-2xl font-bold text-slate-800 mt-2">页面没有找到</h1>
      <p className="text-[15px] text-slate-500 mt-3 max-w-md mx-auto leading-relaxed">
        您访问的页面不存在或已被移除，请检查网址是否正确。
        <br />
        {countdown > 0 ? (
          <span>
            <span className="text-primary font-bold text-lg">{countdown}</span> 秒后自动返回首页
          </span>
        ) : (
          <span className="text-primary">正在跳转…</span>
        )}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
        >
          返回首页
        </a>
        {CHANNEL_LINKS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="inline-flex items-center gap-1.5 px-5 py-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:border-primary hover:text-primary transition-colors"
          >
            {item.label}
          </a>
        ))}
      </div>

      <div className="max-w-3xl w-full mt-12 p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-blue-50 border border-primary/10 text-center">
        <h2 className="text-lg font-bold text-slate-800 mb-2">关于淘课网</h2>
        <p className="text-[13px] text-slate-400 mb-5">企业培训师资课程推广平台</p>
        <p className="text-[15px] text-slate-600 leading-8 max-w-2xl mx-auto">
          淘课网致力给专家讲师提供培训机构对接、数字化增效、TTT赋能等服务，让培训机构轻松找到靠谱的专家讲师并采购他们的课程，协力服务好企业买家，合作共赢。
        </p>
      </div>
    </div>
  );
}
