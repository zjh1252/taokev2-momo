'use client';

import { Plus, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { listMyDemands } from '@/features/demand/api/service';
import {
  DEMAND_STATUS_MAP,
  DemandStatus,
  type DemandListItem,
  type PageResponse,
} from '@/features/demand/api/types';

const STATUS_TABS = [
  { key: 'all', label: '全部需求', value: undefined },
  { key: 'submitted', label: '已提交', value: DemandStatus.SUBMITTED },
  { key: 'processing', label: '处理中', value: DemandStatus.PROCESSING },
  { key: 'matched', label: '已匹配', value: DemandStatus.MATCHED },
  { key: 'completed', label: '已完成', value: DemandStatus.COMPLETED },
  { key: 'cancelled', label: '已取消', value: DemandStatus.CANCELLED },
] as const;

/**
 * 我的需求 — 需求列表 + 发布按钮
 */
export default function DemandsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageData, setPageData] = useState<PageResponse<DemandListItem> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listMyDemands({ status: statusFilter, page: currentPage, size: 10 });
      setPageData(data);
    } catch {
      // apiClient 已弹 toast
    } finally {
      setLoading(false);
    }
  }, [statusFilter, currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = (value: number | undefined) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (min == null && max == null) return '面议';
    if (min != null && max != null) return `${min.toLocaleString()} - ${max.toLocaleString()}元`;
    if (min != null) return `${min.toLocaleString()}元起`;
    return `最高${max!.toLocaleString()}元`;
  };

  const demands = pageData?.list ?? [];

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h2 className="font-bold text-gray-800">我的需求</h2>
        <button
          type="button"
          onClick={() => router.push(ROUTES.UC_DEMANDS_CREATE)}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded text-sm transition-colors flex items-center gap-1"
        >
          <Plus className="size-4" />
          发布新需求
        </button>
      </div>

      <div className="p-6">
        {/* 状态筛选 */}
        <div className="flex items-center gap-4 mb-6 text-sm flex-wrap">
          {STATUS_TABS.map((tab, i) => (
            <span key={tab.key} className="flex items-center gap-4">
              {i > 0 && <span className="text-gray-300">|</span>}
              <button
                type="button"
                onClick={() => handleStatusChange(tab.value)}
                className={statusFilter === tab.value
                  ? 'text-primary font-bold'
                  : 'text-gray-500 hover:text-primary'}
              >
                {tab.label}
              </button>
            </span>
          ))}
        </div>

        {/* 加载中 */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        )}

        {/* 空状态 */}
        {!loading && demands.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="mb-4">暂无需求记录</p>
            <button
              type="button"
              onClick={() => router.push(ROUTES.UC_DEMANDS_CREATE)}
              className="text-primary hover:underline text-sm"
            >
              立即发布需求
            </button>
          </div>
        )}

        {/* 需求列表 */}
        {!loading && demands.length > 0 && (
          <div className="space-y-4">
            {demands.map((d) => {
              const statusInfo = DEMAND_STATUS_MAP[d.status] ?? { label: d.statusLabel, color: 'bg-gray-50 text-gray-500 border-gray-100' };
              const isTerminal = d.status === DemandStatus.COMPLETED || d.status === DemandStatus.CANCELLED;

              return (
                <div
                  key={d.id}
                  className={`border border-slate-200 rounded-lg p-4 hover:border-primary/30 transition-colors ${isTerminal ? 'bg-slate-50/50' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-800 text-[15px]">
                      {d.title || d.trainingTopic || '培训需求'}
                    </h3>
                    <span className={`px-2 py-0.5 border rounded text-xs shrink-0 ml-3 ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  {d.trainingTopic && d.title && (
                    <p className="text-sm text-gray-500 mb-1">培训主题：{d.trainingTopic}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                    <div className="flex gap-4">
                      <span>预算：<span className="text-primary font-medium">{formatBudget(d.budgetMin, d.budgetMax)}</span></span>
                      {d.traineeCount && <span>人数：{d.traineeCount}人</span>}
                      <span>发布时间：{new Date(d.createdAt).toLocaleDateString('zh-CN')}</span>
                      <span className="text-gray-400">需求类型：{d.demandTypeLabel}</span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => router.push(`/dashboard/demands/${d.id}`)}
                        className="text-gray-500 hover:text-primary"
                      >
                        查看详情
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 分页 */}
        {!loading && pageData && pageData.totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-8 text-sm">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="size-4" />
              上一页
            </button>
            <span className="text-gray-500">
              {currentPage} / {pageData.totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= pageData.totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              下一页
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
