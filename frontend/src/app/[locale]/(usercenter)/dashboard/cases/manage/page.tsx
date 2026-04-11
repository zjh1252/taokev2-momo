'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/lib/auth/auth-context';
import { getMyCases, deleteCase } from '@/features/trainer-case/api/service';
import {
  CaseStatus,
  CaseStatusLabelMap,
  type TrainerCase,
} from '@/features/trainer-case/api/types';
import {
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_TABS: { label: string; value: number | undefined }[] = [
  { label: '全部', value: undefined },
  { label: '草稿', value: CaseStatus.DRAFT },
  { label: '待审核', value: CaseStatus.PENDING },
  { label: '已通过', value: CaseStatus.APPROVED },
  { label: '已驳回', value: CaseStatus.REJECTED },
];

const STATUS_BADGE_STYLES: Record<number, string> = {
  [CaseStatus.DRAFT]: 'bg-slate-100 text-slate-600',
  [CaseStatus.PENDING]: 'bg-amber-50 text-amber-600',
  [CaseStatus.APPROVED]: 'bg-green-50 text-green-600',
  [CaseStatus.REJECTED]: 'bg-red-50 text-red-600',
};

/**
 * 管理案例 — 我的案例列表页
 *
 * @author Fangxinxin
 * @date 2026-04-11 18:00
 */
export default function ManageCasesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<number | undefined>(undefined);
  const [cases, setCases] = useState<TrainerCase[]>([]);
  const [loading, setLoading] = useState(true);

  const filteredCases = activeTab === undefined
    ? cases
    : cases.filter((c) => c.status === activeTab);

  const fetchCases = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await getMyCases();
      setCases(list || []);
    } catch {
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此案例吗？此操作不可恢复。')) return;
    try {
      await deleteCase(id);
      fetchCases();
    } catch {
      alert('删除失败');
    }
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">管理案例</h2>
        <Link
          href={ROUTES.UC_CASES_CREATE}
          className="inline-flex items-center gap-1.5 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" />
          发布新案例
        </Link>
      </div>

      <div className="px-6 pt-4 pb-2 flex gap-1 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'px-3.5 py-1.5 text-sm rounded-full transition-colors',
              activeTab === tab.value
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-gray-600 hover:bg-slate-200',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <div className="animate-spin rounded-full size-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Briefcase className="size-12 mb-4 text-gray-300" />
            <p className="text-sm">暂无案例</p>
            <Link
              href={ROUTES.UC_CASES_CREATE}
              className="mt-4 text-sm text-primary hover:underline"
            >
              去发布第一个案例
            </Link>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {filteredCases.map((item) => (
              <CaseCard
                key={item.id}
                item={item}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CaseCard({
  item,
  onDelete,
}: {
  item: TrainerCase;
  onDelete: (id: number) => void;
}) {
  const statusLabel = CaseStatusLabelMap[item.status] || '未知';
  const badgeStyle = STATUS_BADGE_STYLES[item.status] || 'bg-slate-100 text-slate-600';
  const isDraft = item.status === CaseStatus.DRAFT;
  const isRejected = item.status === CaseStatus.REJECTED;

  return (
    <div className="border border-slate-200 rounded-lg p-4 flex gap-4 hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-gray-800 truncate">{item.caseTitle}</h3>
          <span className={cn('text-[11px] px-2 py-0.5 rounded-full shrink-0', badgeStyle)}>
            {statusLabel}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
          <span>{item.enterpriseName}</span>
          {item.industry && <span>· {item.industry}</span>}
          {item.trainingTopic && <span>· {item.trainingTopic}</span>}
          {item.trainingDate && <span>· {item.trainingDate}</span>}
        </div>
        {isRejected && item.rejectReason && (
          <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
            <AlertCircle className="size-3.5" />
            <span>驳回原因：{item.rejectReason}</span>
          </div>
        )}
        <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
          <span>创建于 {item.createdAt?.slice(0, 10)}</span>
          {item.files?.length > 0 && <span>{item.files.length} 个附件</span>}
        </div>
      </div>

      <div className="flex flex-col gap-2 shrink-0 justify-center">
        {(isDraft || isRejected) && (
          <Link
            href={`/dashboard/cases/${item.id}/edit`}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-slate-200 text-gray-600 hover:bg-slate-50 transition-colors"
          >
            <Edit className="size-3.5" />
            编辑
          </Link>
        )}
        {(isDraft || isRejected) && (
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="size-3.5" />
            删除
          </button>
        )}
      </div>
    </div>
  );
}
