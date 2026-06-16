import { homeMetadata } from '@/lib/seo';
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
  loadHomeCases,
  loadHomeExperts,
  loadHomeInternalCourses,
  loadHomePublicCourses,
} from '@/features/home/api/load-home-data';
import { getCategoryTree } from '@/features/course/api/service';
import { getActiveCities } from '@/features/city/api/service';
import { CityChannelCard } from '@/features/city/components/CityChannelCard';

export async function generateMetadata() {
  return homeMetadata();
}

/**
 * 首页 — SSR，推荐专家/案例/课程等区块接入后端 API，失败时回退 mock
 */
export default async function HomePage() {
  const [expertiseCategories, activeCities, experts, cases, internalCourses, publicCourses] =
    await Promise.all([
      getCategoryTree('TRAINER_EXPERTISE').catch(() => []),
      getActiveCities(9).catch(() => []),
      loadHomeExperts(),
      loadHomeCases(),
      loadHomeInternalCourses(),
      loadHomePublicCourses(),
    ]);

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
