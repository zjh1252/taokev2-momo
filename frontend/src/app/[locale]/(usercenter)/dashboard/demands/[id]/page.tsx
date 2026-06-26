'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ROUTES } from '@/config/routes';
import { getDemandDetail, cancelDemand } from '@/features/demand/api/service';
import {
  DEMAND_STATUS_MAP,
  DemandStatus,
  type DemandDetail,
} from '@/features/demand/api/types';
import { Link } from '@/i18n/navigation';

/**
 * 需求详情页
 */
export default function DemandDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<DemandDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getDemandDetail(Number(id))
      .then(setDetail)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!detail || !confirm('确定要取消此需求吗？取消后不可恢复。')) return;
    setCancelling(true);
    try {
      await cancelDemand(detail.id);
      toast.success('需求已取消');
      const updated = await getDemandDetail(detail.id);
      setDetail(updated);
    } catch {
      // apiClient 已弹 toast
    } finally {
      setCancelling(false);
    }
  };

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
        <p>需求不存在或无权查看</p>
        <Link href={ROUTES.UC_DEMANDS} className="text-primary hover:underline text-sm mt-3 inline-block">
          返回需求列表
        </Link>
      </div>
    );
  }

  const statusInfo = DEMAND_STATUS_MAP[detail.status] ?? { label: detail.statusLabel, color: 'bg-gray-50 text-gray-500 border-gray-100' };
  const isTerminal = detail.status === DemandStatus.COMPLETED || detail.status === DemandStatus.CANCELLED;

  const formatBudget = () => {
    if (detail.budgetMin == null && detail.budgetMax == null) return '面议';
    if (detail.budgetMin != null && detail.budgetMax != null) return `${detail.budgetMin.toLocaleString()} - ${detail.budgetMax.toLocaleString()}元`;
    if (detail.budgetMin != null) return `${detail.budgetMin.toLocaleString()}元起`;
    return `最高${detail.budgetMax!.toLocaleString()}元`;
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      {/* 顶部 */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.UC_DEMANDS} className="text-gray-400 hover:text-primary">
            <ArrowLeft className="size-5" />
          </Link>
          <h2 className="font-bold text-gray-800">需求详情</h2>
          <span className={`px-2 py-0.5 border rounded text-xs ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
        {!isTerminal && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1 disabled:opacity-50"
          >
            {cancelling ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
            取消需求
          </button>
        )}
      </div>

      {/* 基本信息 */}
      <div className="p-6 border-b border-slate-100">
        <h3 className="font-bold text-lg text-gray-800 mb-1">
          {detail.title || detail.trainingTopic || '培训需求'}
        </h3>
        {detail.demandNo && (
          <p className="text-sm text-gray-400 font-mono mb-4">单号：{detail.demandNo}</p>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {detail.trainingTopic && (
            <div>
              <span className="text-gray-500">培训主题：</span>
              <span className="text-gray-800">{detail.trainingTopic}</span>
            </div>
          )}
          <div>
            <span className="text-gray-500">需求类型：</span>
            <span className="text-gray-800">{detail.demandTypeLabel}</span>
          </div>
          <div>
            <span className="text-gray-500">预算范围：</span>
            <span className="text-primary font-medium">{formatBudget()}</span>
          </div>
          {detail.traineeCount && (
            <div>
              <span className="text-gray-500">培训人数：</span>
              <span className="text-gray-800">{detail.traineeCount}人</span>
            </div>
          )}
          {detail.formatLabel && (
            <div>
              <span className="text-gray-500">培训形式：</span>
              <span className="text-gray-800">{detail.formatLabel}</span>
            </div>
          )}
          {detail.contactName && (
            <div>
              <span className="text-gray-500">联系人：</span>
              <span className="text-gray-800">{detail.contactName}</span>
            </div>
          )}
          {detail.contactPhone && (
            <div>
              <span className="text-gray-500">联系电话：</span>
              <span className="text-gray-800">{detail.contactPhone}</span>
            </div>
          )}
          {detail.expectedStartDate && (
            <div>
              <span className="text-gray-500">期望开始：</span>
              <span className="text-gray-800">{detail.expectedStartDate}</span>
            </div>
          )}
          <div>
            <span className="text-gray-500">发布时间：</span>
            <span className="text-gray-800">{new Date(detail.createdAt).toLocaleString('zh-CN')}</span>
          </div>
        </div>
        {detail.description && (
          <div className="mt-4">
            <span className="text-sm text-gray-500">详细描述：</span>
            <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{detail.description}</p>
          </div>
        )}
      </div>

      {/* 跟进时间线 */}
      <div className="p-6">
        <h4 className="font-bold text-gray-800 mb-4">处理进度</h4>
        {detail.followUps.length === 0 ? (
          <p className="text-gray-400 text-sm">暂无跟进记录</p>
        ) : (
          <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
            {detail.followUps.map((f) => (
              <div key={f.id} className="relative">
                <div className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-white" />
                <div className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800">{f.actionLabel}</span>
                    {f.newStatusLabel && (
                      <span className="text-xs text-gray-500">
                        {f.oldStatusLabel ? `${f.oldStatusLabel} → ` : ''}{f.newStatusLabel}
                      </span>
                    )}
                  </div>
                  {f.content && <p className="text-gray-600">{f.content}</p>}
                  <span className="text-xs text-gray-400 mt-1 block">
                    {new Date(f.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
