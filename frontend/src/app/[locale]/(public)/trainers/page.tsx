import { getTranslations } from 'next-intl/server';
import { TrainerListSection } from '@/features/trainer/components/list/TrainerListSection';
import { getTrainerList, getCategoryTree } from '@/features/trainer/api/service';

export async function generateMetadata() {
  const t = await getTranslations('common');
  return {
    title: '专家列表 - 淘课网',
    description: '发现全国优秀培训专家，按擅长领域、行业筛选，查看评分与评价。',
  };
}

/**
 * 专家列表页 — SSR 首屏数据 + 客户端筛选交互
 */
export default async function TrainersPage() {
  const [initialData, expertiseTree, industryTree] = await Promise.all([
    getTrainerList({ page: 1, size: 15 }).catch(() => ({
      list: [],
      total: 0,
      page: 1,
      size: 15,
      totalPages: 0,
    })),
    getCategoryTree('TRAINER_EXPERTISE').catch(() => []),
    getCategoryTree('TRAINER_INDUSTRY').catch(() => []),
  ]);

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">培训专家</h1>
        <p className="text-slate-500 mt-2">
          发现全国优秀培训专家，助力企业人才发展
        </p>
      </div>

      <TrainerListSection
        initialData={initialData}
        expertiseTree={expertiseTree}
        industryTree={industryTree}
      />
    </div>
  );
}
