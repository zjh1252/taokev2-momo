'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config/routes';
import { getMyPartnerApplication } from '@/features/alliance-partner/api/service';
import type { AlliancePartnerApplication } from '@/features/alliance-partner/api/types';
import { PartnerAgreementContent } from '@/features/alliance-partner/components/partner-agreement-content';
import { PartnerApplyForm } from '@/features/alliance-partner/components/partner-apply-form';

/**
 * 培训合伙人协议与申请页。
 *
 * @author Fangxinxin
 * @date 2026-07-13 18:30
 */
export default function PartnerPage() {
  const router = useRouter();
  const [application, setApplication] =
    useState<AlliancePartnerApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;
    getMyPartnerApplication()
      .then((result) => {
        if (!active) return;
        if (result?.status === 1 || result?.status === 2) {
          router.replace(ROUTES.UC_ALLIANCE_PARTNER_PENDING);
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
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center">
        <h2 className="font-bold text-gray-800">培训合伙人</h2>
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
          {application?.status === 3 ? (
            <div className="mb-6 w-full rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="font-bold">上次申请未通过，可修改资料后重新提交。</p>
              <p className="mt-1">
                驳回原因：{application.rejectReason || '未填写原因'}
              </p>
            </div>
          ) : null}
          <PartnerAgreementContent />
          <PartnerApplyForm />
        </div>
      )}
    </section>
  );
}
