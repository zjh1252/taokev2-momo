'use client';

import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { CreateDemandForm } from '@/features/demand/components/CreateDemandForm';
import { ROUTES } from '@/config/routes';
import { Link } from '@/i18n/navigation';

/**
 * 游客发布培训需求 — 无需登录
 */
export default function PublicPublishDemandPage() {
  const [submittedNo, setSubmittedNo] = useState<string | null>(null);

  if (submittedNo) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        <CheckCircle2 className="size-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">需求提交成功</h1>
        <p className="text-gray-600 mb-1">您的需求单号：</p>
        <p className="text-xl font-mono font-semibold text-primary mb-4">{submittedNo}</p>
        <p className="text-sm text-gray-500 mb-8">请保存单号以便查询，客服将在 1 个工作日内与您联系。</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={ROUTES.HOME}
            className="px-6 py-2.5 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90"
          >
            返回首页
          </Link>
          <Link
            href={ROUTES.LOGIN}
            className="px-6 py-2.5 rounded-md border border-slate-300 text-gray-600 text-sm hover:bg-slate-50"
          >
            登录查看我的需求
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <CreateDemandForm
        mode="public"
        cancelHref={ROUTES.HOME}
        onSuccess={(demandNo) => setSubmittedNo(demandNo ?? '已提交')}
      />
    </div>
  );
}
