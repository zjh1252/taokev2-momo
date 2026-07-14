'use client';

import type { PartnerPanelStatus } from '../types';

const COPY = {
  pending: {
    title: '培训合伙人申请审核中',
    body: '您的申请资料已成功提交。工作人员将在1-3个工作日内完成您的审核。审核结果将通过站内消息通知您。',
    stampSrc: '/statics/images/alliance/partner-stamp-pending.png',
    stampAlt: '审批中',
    panelBg: 'bg-[#fff8e8]',
    titleClass: 'text-[#a46732]',
    textClass: 'text-[#973c00]',
    lineClass: 'border-[#d4a574]',
    watermarkClass: 'text-[rgba(255,241,201,0.62)]',
  },
  approved: {
    title: '培训合伙人申请已通过',
    body: '恭喜您已通过培训合伙人审核。',
    stampSrc: '/statics/images/alliance/partner-stamp-approved.png',
    stampAlt: '已通过',
    panelBg: 'bg-[#eefaf0]',
    titleClass: 'text-[#1c7b19]',
    textClass: 'text-[#195e0e]',
    lineClass: 'border-[#8fd49a]',
    watermarkClass: 'text-[rgba(210,255,213,0.62)]',
  },
} as const;

export type PartnerStatusPanelProps = {
  status: PartnerPanelStatus;
  partnerCode: string;
};

/**
 * 培训合伙人申请结果态（审核中 / 已通过），对齐 Figma 31:609 / 31:608。
 */
export function PartnerStatusPanel({
  status,
  partnerCode,
}: PartnerStatusPanelProps) {
  const c = COPY[status];

  return (
    <div
      className={`relative min-h-[560px] overflow-hidden ${c.panelBg}`}
    >
      <div
        className={`pointer-events-none absolute bottom-8 left-8 select-none font-bold text-[120px] leading-none md:text-[160px] ${c.watermarkClass}`}
        aria-hidden
      >
        TAOKE
      </div>

      <div className="relative z-[1] mx-auto flex max-w-3xl flex-col items-center px-8 pb-28 pt-14 text-center">
        <h1 className={`text-3xl font-bold md:text-[40px] ${c.titleClass}`}>
          {c.title}
        </h1>
        <div
          className={`mt-6 h-px w-full max-w-xl border-t ${c.lineClass}`}
        />
        <p
          className={`mt-10 max-w-2xl text-lg leading-relaxed md:text-[26px] md:leading-[1.8] ${c.textClass}`}
        >
          {c.body}
        </p>
        <p className={`mt-10 text-base md:text-[22px] ${c.textClass}`}>
          <span className="font-normal">培训合伙人编号：</span>
          <span className="font-bold">{partnerCode}</span>
        </p>
      </div>

      <img
        src={c.stampSrc}
        alt={c.stampAlt}
        className="pointer-events-none absolute bottom-10 right-10 z-[2] w-[200px] md:w-[260px] select-none"
      />
    </div>
  );
}
