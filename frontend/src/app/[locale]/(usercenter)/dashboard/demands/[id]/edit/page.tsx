'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ROUTES } from '@/config/routes';
import { getDemandDetail, updateDemand } from '@/features/demand/api/service';
import { DemandStatus, type DemandDetail } from '@/features/demand/api/types';
import { CreateDemandForm } from '@/features/demand/components/CreateDemandForm';
import { Link, useRouter } from '@/i18n/navigation';

export default function EditDemandPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<DemandDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getDemandDetail(Number(id))
      .then(setDetail)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="text-center py-32 text-gray-400">
        需求不存在或无权查看
      </div>
    );
  }

  const isTerminal = detail.status === DemandStatus.COMPLETED || detail.status === DemandStatus.CANCELLED;

  if (isTerminal) {
    return (
      <div className="text-center py-32 text-gray-400">
        该需求当前状态不可编辑
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          href={`/dashboard/demands/${detail.id}`}
          className="inline-flex items-center gap-1 text-gray-500 hover:text-primary text-sm"
        >
          <ArrowLeft className="size-4" />
          返回需求详情
        </Link>
      </div>
      <CreateDemandForm
        mode="auth"
        title="编辑培训需求"
        cancelHref={ROUTES.UC_DEMANDS}
        submitLabel="保存修改"
        initialValue={{
          demandType: detail.demandType,
          title: detail.title || '',
          trainingTopic: detail.trainingTopic || '',
          traineeCount: detail.traineeCount ?? undefined,
          budgetMin: detail.budgetMin ?? undefined,
          budgetMax: detail.budgetMax ?? undefined,
          expectedStartDate: detail.expectedStartDate ?? undefined,
          format: detail.format ?? undefined,
          description: detail.description || '',
          sourceCaseId: detail.sourceCaseId ?? undefined,
          sourceCourseId: detail.sourceCourseId ?? undefined,
          contactName: detail.contactName || '',
          contactPhone: detail.contactPhone || '',
          provinceId: detail.provinceId ?? undefined,
          cityId: detail.cityId ?? undefined,
          districtId: detail.districtId ?? undefined
        }}
        onSubmit={(data) => updateDemand(detail.id, data)}
        onSuccess={() => {
          toast.success('需求修改成功');
          router.push(`/dashboard/demands/${detail.id}`);
        }}
      />
    </div>
  );
}
