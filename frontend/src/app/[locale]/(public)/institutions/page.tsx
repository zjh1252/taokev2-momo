import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { InstitutionListSection } from '@/features/institution/components/list/InstitutionListSection';
import {
  getInstitutionList,
  getInstitutionFacets,
  getProvinces,
  getRecommendedInstitutions,
  getTopRatedInstitutions,
  getWeeklyActiveInstitutions,
  getNewestInstitutions,
} from '@/features/institution/api/service';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: '培训机构 - 淘课网',
    description: '发现全国优秀培训机构，按擅长领域、行业筛选，查看评分与评价。',
  };
}

const EMPTY_PAGE = { list: [], total: 0, page: 1, size: 15, totalPages: 0 };
const EMPTY_FACETS = { specialties: [], industries: [] };

/**
 * 机构列表页 — SSR 首屏数据 + 客户端筛选交互
 */
export default async function InstitutionsPage() {
  const [initialData, facets, provinces, recommended, topRated, weeklyActive, newest] = await Promise.all([
    getInstitutionList({ page: 1, size: 15 }).catch(() => EMPTY_PAGE),
    getInstitutionFacets().catch(() => EMPTY_FACETS),
    getProvinces().catch(() => []),
    getRecommendedInstitutions(4).catch(() => []),
    getTopRatedInstitutions(5).catch(() => []),
    getWeeklyActiveInstitutions(5).catch(() => []),
    getNewestInstitutions(5).catch(() => []),
  ]);

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      {/* 面包屑导航 — 公共组件 */}
      <PageBreadcrumb items={[{ label: '培训机构' }]} />

      <InstitutionListSection
        initialData={initialData}
        facets={facets}
        provinces={provinces}
        recommended={recommended}
        topRated={topRated}
        weeklyActive={weeklyActive}
        newest={newest}
      />
    </main>
  );
}
