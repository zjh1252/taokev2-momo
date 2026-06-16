import { Link } from '@/i18n/navigation';
import { ChevronRight } from 'lucide-react';
import { TrainerListSection } from '@/features/trainer/components/list/TrainerListSection';
import {
  getTrainerList,
  getCategoryTree,
  getTopRecommendedTrainers,
  getRecentTrainerCases,
} from '@/features/trainer/api/service';

export async function generateMetadata() {
  return {
    title: '专家列表 - 淘课网',
    description: '发现全国优秀培训专家，按擅长领域、行业筛选，查看评分与评价。',
  };
}

/**
 * 专家列表页 — SSR 首屏数据 + 客户端筛选交互
 *
 * <p>布局：</p>
 * <ol>
 *   <li>顶部面包屑（与 /opencourses 保持一致）。</li>
 *   <li>左侧：hover 弹出式筛选侧栏（擅长领域 / 擅长行业 / 长驻省市）。</li>
 *   <li>右侧主区：顶部「3 张推荐专家头像 + NEW 案例两条滚动」 + 已选 chips +
 *       排序栏 + 专家列表 + 分页。</li>
 * </ol>
 */
export default async function TrainersPage() {
  const [initialData, expertiseTree, industryTree, recommendedTrainers, recentCases] =
    await Promise.all([
      getTrainerList({ page: 1, size: 15 }).catch(() => ({
        list: [],
        total: 0,
        page: 1,
        size: 15,
        totalPages: 0,
      })),
      getCategoryTree('TRAINER_EXPERTISE').catch(() => []),
      getCategoryTree('TRAINER_INDUSTRY').catch(() => []),
      getTopRecommendedTrainers(9).catch(() => []),
      getRecentTrainerCases(10).catch(() => []),
    ]);

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      {/* 面包屑导航 — 与 /opencourses 保持一致 */}
      <nav className="flex text-sm text-slate-500 gap-2 items-center">
        <span>你的位置：</span>
        <Link href="/" className="hover:text-primary transition-colors">
          首页
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-slate-800 font-medium">培训专家</span>
      </nav>

      <TrainerListSection
        initialData={initialData}
        expertiseTree={expertiseTree}
        industryTree={industryTree}
        recommendedTrainers={recommendedTrainers}
        recentCases={recentCases}
      />
    </main>
  );
}
