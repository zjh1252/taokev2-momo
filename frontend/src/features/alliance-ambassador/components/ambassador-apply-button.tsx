'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ROUTES } from '@/config/routes';
import { submitAmbassadorApplication } from '../api/service';

interface AmbassadorApplyButtonProps {
  rejectReason?: string | null;
}

/**
 * 推广大使一键申请按钮。
 *
 * @author Fangxinxin
 * @date 2026-07-14 14:10
 */
export function AmbassadorApplyButton({
  rejectReason,
}: AmbassadorApplyButtonProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitAmbassadorApplication({
        agreementSigned: true,
        agreementVersion: 'v1',
      });
      toast.success('申请已提交');
      router.push(ROUTES.UC_ALLIANCE_AMBASSADOR_PENDING);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '提交失败，请稍后重试');
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-10 flex w-full flex-col items-center gap-3">
      {rejectReason ? (
        <p className="w-full rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          上次申请未通过：{rejectReason}
        </p>
      ) : null}
      <button
        type="button"
        disabled={submitting}
        onClick={() => void handleSubmit()}
        className="bg-[#cc0000] px-8 py-3 text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-[#b30000] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting
          ? '提交中...'
          : '本人同意上述协议并自愿申请成为推广大使'}
      </button>
    </div>
  );
}
