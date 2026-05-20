import { getTranslations } from 'next-intl/server';
import {
  HeroSection,
  AiMatchBanner,
  ExpertsSection,
  CasesSection,
  CoursesSection,
  PublicCoursesSection,
  AiEngagementBanner,
} from '@/features/home/components';
import {
  featuredExperts,
  featuredCases,
  popularInternalCourses,
  upcomingPublicCourses,
} from '@/features/home/data/mock';
import { getCategoryTree } from '@/features/course/api/service';
import { getActiveCities } from '@/features/city/api/service';
import { CityChannelCard } from '@/features/city/components/CityChannelCard';

export async function generateMetadata() {
  const t = await getTranslations('common');
  return { title: t('site.title'), description: t('site.description') };
}

/**
 * 首页 — SSR，分类侧栏与城市频道已接入后端 API，其他区块仍使用 mock
 * TODO: 将其余 mock 数据替换为 fetch('/api/...') 调用
 */
export default async function HomePage() {
  const [expertiseCategories, activeCities] = await Promise.all([
    getCategoryTree('TRAINER_EXPERTISE').catch(() => []),
    getActiveCities(9).catch(() => []),
  ]);

  const experts = featuredExperts;
  const cases = featuredCases;
  const internalCourses = popularInternalCourses;
  const publicCourses = upcomingPublicCourses;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
      <HeroSection categories={expertiseCategories} />
      <AiMatchBanner />
      <ExpertsSection experts={experts} />
      <CasesSection cases={cases} />
      <CoursesSection courses={internalCourses} />
      <PublicCoursesSection courses={publicCourses} />

      {/* 底部：左侧 banner（70%）+ 右侧城市频道入口（30%），fr 比例分配以避开 gap 引起的溢出 */}
      <section className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-4 items-stretch">
        <AiEngagementBanner />
        <CityChannelCard cities={activeCities} />
      </section>
    </div>
  );
}
