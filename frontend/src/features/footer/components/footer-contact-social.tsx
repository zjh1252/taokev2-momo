'use client';

import { useEffect, useState } from 'react';
import {
  FOOTER_CONTACT_SOCIAL,
  type FooterSocialKey,
} from '@/features/footer/constants/footer-links';

function SocialIcon({
  short,
  hoverClass,
}: {
  short: string;
  hoverClass: string;
}) {
  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-[#2A2A2A] transition-colors ${hoverClass}`}
    >
      <span className="text-xs text-white">{short}</span>
    </div>
  );
}

const HOVER_BG: Record<FooterSocialKey, string> = {
  wechat: 'group-hover:bg-[#07C160]',
  douyin: 'group-hover:bg-white group-hover:text-black',
};

/**
 * 联系我们：悬停切换右侧二维码；点击放大查看
 *
 * @author Fangxinxin
 * @date 2026-07-23 17:25
 */
export function FooterContactSocial() {
  const [activeKey, setActiveKey] = useState<FooterSocialKey>('wechat');
  const [enlarged, setEnlarged] = useState(false);
  const active =
    FOOTER_CONTACT_SOCIAL.find((item) => item.key === activeKey) ??
    FOOTER_CONTACT_SOCIAL[0];

  useEffect(() => {
    if (!enlarged) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEnlarged(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enlarged]);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <h3 className="text-[16px] font-bold text-white">联系我们</h3>
          <ul className="flex flex-col gap-4 text-[13px]">
            {FOOTER_CONTACT_SOCIAL.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  className="group flex w-full cursor-pointer items-center gap-2 text-left transition-colors hover:text-white"
                  onMouseEnter={() => setActiveKey(item.key)}
                  onFocus={() => setActiveKey(item.key)}
                  onClick={() => {
                    setActiveKey(item.key);
                    setEnlarged(true);
                  }}
                >
                  <SocialIcon short={item.short} hoverClass={HOVER_BG[item.key]} />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          className="mt-8 flex h-40 w-32 shrink-0 cursor-zoom-in items-center justify-center overflow-hidden rounded-md bg-white p-1.5"
          onClick={() => setEnlarged(true)}
          aria-label={`放大查看${active.label}`}
        >
          <img
            src={active.qrSrc}
            alt={active.qrAlt}
            className="max-h-full max-w-full object-contain"
          />
        </button>
      </div>

      {enlarged ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6"
          role="dialog"
          aria-modal="true"
          aria-label={active.qrAlt}
          onClick={() => setEnlarged(false)}
        >
          <button
            type="button"
            className="absolute right-6 top-6 rounded-full bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
            onClick={() => setEnlarged(false)}
          >
            关闭
          </button>
          <img
            src={active.qrSrc}
            alt={active.qrAlt}
            className="max-h-[85vh] max-w-[min(90vw,420px)] rounded-lg bg-white object-contain p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
