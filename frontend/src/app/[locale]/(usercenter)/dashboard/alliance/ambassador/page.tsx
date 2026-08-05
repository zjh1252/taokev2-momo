'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config/routes';
import { getMyAmbassadorApplication } from '@/features/alliance-ambassador/api/service';
import type { AllianceAmbassadorApplication } from '@/features/alliance-ambassador/api/types';
import { AmbassadorAgreementContent } from '@/features/alliance-ambassador/components/ambassador-agreement-content';
import { AmbassadorApplyButton } from '@/features/alliance-ambassador/components/ambassador-apply-button';

/**
 * 推广大使协议与申请页。
 *
 * @author Fangxinxin
 * @date 2026-07-14 14:10
 */
export default function AmbassadorPage() {
  const router = useRouter();
  const [application, setApplication] =
    useState<AllianceAmbassadorApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;
    getMyAmbassadorApplication()
      .then((result) => {
        if (!active) return;
        if (result?.status === 1 || result?.status === 2) {
          router.replace(ROUTES.UC_ALLIANCE_AMBASSADOR_PENDING);
          return;
        }
        setApplication(result);
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
  }, [router]);

  return (
    <section className="min-h-[500px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h2 className="font-bold text-gray-800">培训宝推广大使</h2>
      </div>

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
      ) : (
        <div className="mx-auto flex max-w-4xl flex-col items-center p-8">
          <AmbassadorAgreementContent />
          <AmbassadorApplyButton rejectReason={application?.rejectReason} />
        </div>
      )}
    </section>
  );
}
