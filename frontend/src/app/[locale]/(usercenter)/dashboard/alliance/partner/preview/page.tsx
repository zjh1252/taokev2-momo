'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PartnerPageShell } from '@/features/alliance/components/PartnerPageShell';
import { PartnerStatusPanel } from '@/features/alliance/components/PartnerStatusPanel';
import {
  PREVIEW_PARTNER_CODE,
  parsePartnerPreviewStatus,
} from '@/features/alliance/partner-application';

function PartnerPreviewInner() {
  const searchParams = useSearchParams();
  const status = parsePartnerPreviewStatus(searchParams.get('status'));

  return (
    <PartnerPageShell>
      <PartnerStatusPanel
        status={status}
        partnerCode={PREVIEW_PARTNER_CODE}
      />
    </PartnerPageShell>
  );
}

/**
 * 培训合伙人状态预览 — 不读真实申请数据，仅 ?status=pending|approved。
 */
export default function PartnerPreviewPage() {
  return (
    <Suspense
      fallback={
        <PartnerPageShell>
          <div className="min-h-[400px] bg-[#fff8e8]" />
        </PartnerPageShell>
      }
    >
      <PartnerPreviewInner />
    </Suspense>
  );
}
