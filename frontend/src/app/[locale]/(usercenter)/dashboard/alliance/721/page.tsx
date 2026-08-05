'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/lib/auth/auth-context';
import { ROLE_TRAINER } from '@/lib/auth/constants';
import { getMyLecturer721Application } from '@/features/alliance-lecturer721/api/service';
import type { AllianceLecturer721Application } from '@/features/alliance-lecturer721/api/types';
import { Lecturer721AgreementContent } from '@/features/alliance-lecturer721/components/lecturer721-agreement-content';
import { Lecturer721ApplyForm } from '@/features/alliance-lecturer721/components/lecturer721-apply-form';

/**
 * 721 讲师合作协议与申请页。
 *
 * @author Fangxinxin
 * @date 2026-07-14 14:15
 */
export default function Alliance721Page() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [application, setApplication] =
    useState<AllianceLecturer721Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const isActiveTrainer =
    user?.roles.some((role) => role.role === ROLE_TRAINER && role.status === 1) ??
    false;

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    getMyLecturer721Application()
      .then((result) => {
        if (!active) return;
        if (result?.status === 1 || result?.status === 2) {
          router.replace(ROUTES.UC_ALLIANCE_721_PENDING);
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
  }, [authLoading, router]);

  return (
    <section className="min-h-[500px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h2 className="font-bold text-gray-800">721讲师合作</h2>
      </div>

      {authLoading || loading ? (
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
      ) : !isActiveTrainer ? (
        <div className="flex min-h-[440px] flex-col items-center justify-center gap-4 px-6 text-center text-sm text-gray-600">
          <p>仅已通过的专家可申请 721 讲师合作。</p>
          <Link
            href={ROUTES.UC_APPLY}
            className="rounded bg-[#cc0000] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#b30000]"
          >
            去申请专家入驻
          </Link>
        </div>
      ) : (
        <div className="mx-auto flex max-w-4xl flex-col items-center p-8">
          <Lecturer721AgreementContent />
          <Lecturer721ApplyForm rejectReason={application?.rejectReason} />
        </div>
      )}
    </section>
  );
}
