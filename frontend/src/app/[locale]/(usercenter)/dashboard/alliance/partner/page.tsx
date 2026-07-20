'use client';

import { useEffect, useState } from 'react';
import { PartnerPageShell } from '@/features/alliance/components/PartnerPageShell';
import { PartnerStatusPanel } from '@/features/alliance/components/PartnerStatusPanel';
import {
  fetchPartnerApplicationStatus,
  shouldShowPartnerStatusPanel,
} from '@/features/alliance/partner-application';
import type { PartnerApplicationSnapshot } from '@/features/alliance/types';
import { PartnerAgreementContent } from '@/features/alliance-partner/components/partner-agreement-content';
import { PartnerApplyForm } from '@/features/alliance-partner/components/partner-apply-form';

/**
 * 培训合伙人协议与申请页。
 *
 * @author Fangxinxin
 * @date 2026-07-13 18:30
 */
export default function PartnerPage() {
  const [snapshot, setSnapshot] = useState<PartnerApplicationSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetchPartnerApplicationStatus()
      .then((result) => {
        if (!active) return;
        setSnapshot(result);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoadFailed(true);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <PartnerPageShell>
      {loading ? (
        <div className="flex min-h-[440px] items-center justify-center text-sm text-gray-500">
          正在加载申请状态...
        </div>
      ) : loadFailed ? (
        <div className="flex min-h-[440px] flex-col items-center justify-center gap-4 text-sm text-gray-500">
          <p>申请状态加载失败，请稍后重试。</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="cursor-pointer text-primary hover:underline"
          >
            重新加载
          </button>
        </div>
      ) : snapshot && shouldShowPartnerStatusPanel(snapshot.status) ? (
        <PartnerStatusPanel
          status={snapshot.status}
          partnerCode={snapshot.partnerCode ?? ''}
        />
      ) : (
        <div className="mx-auto flex max-w-4xl flex-col items-center p-8">
          <PartnerAgreementContent />
          <PartnerApplyForm />
        </div>
      )}
    </PartnerPageShell>
  );
}
