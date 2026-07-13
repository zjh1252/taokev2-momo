'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config/routes';
import { getMyPartnerApplication } from '@/features/alliance-partner/api/service';
import type { AlliancePartnerApplication } from '@/features/alliance-partner/api/types';

const STATUS_CONTENT = {
  1: {
    title: '培训合伙人申请审核中',
    description:
      '您的申请资料已成功提交。工作人员将在 1-3 个工作日内完成审核，审核结果将通过站内消息通知您。',
    tone: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  2: {
    title: '培训合伙人申请已通过',
    description: '恭喜您已通过培训合伙人申请审核。',
    tone: 'border-green-200 bg-green-50 text-green-800',
  },
  3: {
    title: '培训合伙人申请未通过',
    description: '您可以根据驳回原因修改资料后重新提交申请。',
    tone: 'border-red-200 bg-red-50 text-red-800',
  },
} as const;

/**
 * 培训合伙人申请状态页。
 *
 * @author Fangxinxin
 * @date 2026-07-13 18:30
 */
export default function PartnerPendingPage() {
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
        if (!result) {
          router.replace(ROUTES.UC_ALLIANCE_PARTNER);
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

  const content = application ? STATUS_CONTENT[application.status] : null;

  return (
    <section className="min-h-[500px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h2 className="font-bold text-gray-800">培训合伙人</h2>
      </div>
      <div className="flex min-h-[440px] items-center justify-center px-6 py-16">
        {loading ? (
          <p className="text-sm text-gray-500">正在加载申请状态...</p>
        ) : loadFailed ? (
          <div className="text-center text-sm text-gray-500">
            <p>申请状态加载失败，请稍后重试。</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 cursor-pointer text-primary hover:underline"
            >
              重新加载
            </button>
          </div>
        ) : application && content ? (
          <div className="w-full max-w-2xl text-center">
            <div className={`rounded-xl border px-8 py-12 ${content.tone}`}>
              <h1 className="text-2xl font-bold">{content.title}</h1>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-7">
                {content.description}
              </p>
              {application.status === 2 ? (
                <p className="mt-6 text-sm">
                  培训合伙人编号：
                  <span className="font-bold">{application.partnerCode}</span>
                </p>
              ) : null}
              {application.status === 3 ? (
                <>
                  <p className="mt-6 text-sm">
                    驳回原因：
                    <span className="font-bold">
                      {application.rejectReason || '未填写原因'}
                    </span>
                  </p>
                  <Link
                    href={ROUTES.UC_ALLIANCE_PARTNER}
                    className="mt-8 inline-flex rounded bg-[#cc0000] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#b30000]"
                  >
                    返回修改申请
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
