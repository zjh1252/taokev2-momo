'use client';

import type { PartnerPanelStatus } from '../types';

const COPY = {
  pending: {
    title: '培训合伙人申请审核中',
    body: '您的申请资料已成功提交。工作人员将在1-3个工作日内完成您的审核。审核结果将通过站内消息通知您。',
    stampSrc: '/statics/images/alliance/partner-stamp-pending.png',
    stampAlt: '审批中',
    watermarkSrc: '/statics/images/alliance/partner-watermark-pending.png',
    /** 上浅下极浅暖黄渐变，避免压住水印 */
    panelStyle: {
      background:
        'linear-gradient(180deg, #ffffff 0%, #fffdf9 55%, #fbf6ea 100%)',
    },
    titleClass: 'text-[#a46732]',
    textClass: 'text-[#973c00]',
    lineClass: 'border-[#d4a574]',
  },
  approved: {
    title: '培训合伙人申请已通过',
    body: '恭喜您已通过培训合伙人审核。',
    stampSrc: '/statics/images/alliance/partner-stamp-approved.png',
    stampAlt: '已通过',
    watermarkSrc: '/statics/images/alliance/partner-watermark-approved.png',
    /** 上浅下极浅绿渐变，避免压住水印 */
    panelStyle: {
      background:
        'linear-gradient(180deg, #ffffff 0%, #f8fcf9 55%, #eef7f0 100%)',
    },
    titleClass: 'text-[#1c7b19]',
    textClass: 'text-[#195e0e]',
    lineClass: 'border-[#8fd49a]',
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
      className="relative min-h-[400px] overflow-hidden md:min-h-[440px]"
      style={c.panelStyle}
    >
      <img
        src={c.watermarkSrc}
        alt=""
        aria-hidden
        className="pointer-events-none absolute bottom-2 left-1/2 z-0 w-[78%] max-w-[720px] -translate-x-1/2 select-none opacity-100 md:bottom-3 md:w-[72%]"
      />

      {/* 标题单独贴上：移动标题不影响正文 */}
      <div className="absolute left-0 right-0 top-5 z-[1] flex flex-col items-center px-8 text-center md:top-6">
        <h1
          className={`text-2xl font-bold md:text-[32px] md:leading-tight ${c.titleClass}`}
        >
          {c.title}
        </h1>
        <div
          className={`mt-4 h-px w-full max-w-lg border-t ${c.lineClass}`}
        />
      </div>

      {/* 正文：整块贴在垂直中线以上，底部卡在中线 */}
      <div className="absolute inset-x-0 top-0 bottom-1/2 z-[1] flex flex-col items-center justify-end px-8 text-center">
        <p
          className={`max-w-xl text-base leading-relaxed md:text-lg md:leading-[1.75] ${c.textClass}`}
        >
          {c.body}
        </p>
        <p className={`mt-6 text-sm md:text-base ${c.textClass}`}>
          <span className="font-normal">培训合伙人编号：</span>
          <span className="font-bold">{partnerCode}</span>
        </p>
      </div>

      <img
        src={c.stampSrc}
        alt={c.stampAlt}
        className="pointer-events-none absolute bottom-6 right-6 z-[2] w-[150px] select-none md:bottom-8 md:right-8 md:w-[190px]"
      />
    </div>
  );
}
