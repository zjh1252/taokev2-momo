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

export async function generateMetadata() {
  const t = await getTranslations('common');
  return { title: t('site.title'), description: t('site.description') };
}

/**
 * 首页 — SSR，分类侧栏已接入后端 API，其他区块仍使用 mock
 * TODO: 将其余 mock 数据替换为 fetch('/api/...') 调用
 */
export default async function HomePage() {
  const expertiseCategories = await getCategoryTree('TRAINER_EXPERTISE').catch(() => []);

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
      <AiEngagementBanner />
    </div>
  );
}
