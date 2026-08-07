import { homeMetadata } from '@/lib/seo';
import {
  HeroSection,
  AiMatchBanner,
  ExpertsSection,
  CasesSection,
  CoursesSection,
  PublicCoursesSection,
} from '@/features/home/components';
import {
  loadHomeBanners,
  loadHomeCases,
  loadHomeExperts,
  loadHomeInternalCourses,
  loadHomePublicCourses,
} from '@/features/home/api/load-home-data';
import { getCachedTrainerExpertiseTree } from '@/lib/cached-categories';
import { getActiveCitiesCached } from '@/features/city/api/server';
import { CityChannelCard } from '@/features/city/components/CityChannelCard';

export async function generateMetadata() {
  return homeMetadata('/');
}

/**
 * 首页 — SSR，推荐专家/案例/课程等区块接入后端 API（v3test），接口失败时课程区块为空（不再回退 mock）
 * <p>分类树必须走 serverApiGet（{@code getCachedTrainerExpertiseTree}），
 * 不可用客户端 {@code apiGet}：RSC 无 localStorage token，会被当成未登录抛错后 catch 成空数组，侧栏「课程分类」空白。</p>
 */
export default async function HomePage() {
  const [expertiseCategories, activeCities, banners, experts, cases, internalCourses, publicCourses] =
    await Promise.all([
      getCachedTrainerExpertiseTree(),
      getActiveCitiesCached(18).catch(() => []),
      loadHomeBanners(),
      loadHomeExperts(),
      loadHomeCases(),
      loadHomeInternalCourses(),
      loadHomePublicCourses(),
    ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
      <HeroSection categories={expertiseCategories} banners={banners} />
      <AiMatchBanner />
      <ExpertsSection experts={experts} />
      <CasesSection cases={cases} />
      <CoursesSection courses={internalCourses} />
      <PublicCoursesSection courses={publicCourses} />

      <CityChannelCard cities={activeCities} />
    </div>
  );
}
