'use client';

import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { CreateDemandForm } from '@/features/demand/components/CreateDemandForm';
import { ROUTES } from '@/config/routes';
import { Link, useRouter } from '@/i18n/navigation';

/**
 * 登录用户 — 发布需求页
 */
export default function CreateDemandPage() {
  const router = useRouter();

  return (
    <div>
      <div className="mb-4">
        <Link href={ROUTES.UC_DEMANDS} className="inline-flex items-center gap-1 text-gray-500 hover:text-primary text-sm">
          <ArrowLeft className="size-4" />
          返回我的需求
        </Link>
      </div>
      <CreateDemandForm
        mode="auth"
        cancelHref={ROUTES.UC_DEMANDS}
        onSuccess={() => {
          toast.success('需求发布成功！');
          router.push(ROUTES.UC_DEMANDS);
        }}
      />
    </div>
  );
}
