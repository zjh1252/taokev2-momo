import { getTranslations } from 'next-intl/server';
import {
  HeroSection,
  AiMatchBanner,
  ExpertsSection,
  CasesSection,
  CoursesSection,
  PublicCoursesSection,
  AiEngagementBanner,
} from '@/modules/home/components';
import {
  heroCategories,
  featuredExperts,
  featuredCases,
  popularInternalCourses,
  upcomingPublicCourses,
} from '@/modules/home/data/mock';

export async function generateMetadata() {
  const t = await getTranslations('common');
  return { title: t('site.title'), description: t('site.description') };
}

/**
 * 首页 — SSR，数据当前使用 mock，后续替换为 API 调用
 * TODO: 将 mock 数据替换为 fetch('/api/...') 调用
 */
export default async function HomePage() {
  const categories = heroCategories;
  const experts = featuredExperts;
  const cases = featuredCases;
  const internalCourses = popularInternalCourses;
  const publicCourses = upcomingPublicCourses;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
      <HeroSection categories={categories} />
      <AiMatchBanner />
      <ExpertsSection experts={experts} />
      <CasesSection cases={cases} />
      <CoursesSection courses={internalCourses} />
      <PublicCoursesSection courses={publicCourses} />
      <AiEngagementBanner />
    </div>
  );
}
