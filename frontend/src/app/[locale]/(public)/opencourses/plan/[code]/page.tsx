import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { openCourseDetailMetadata, fallbackDetailMetadata } from '@/lib/seo';
import { getCourseDetail } from '@/features/course/api/service';
import { OpenCoursePlanHero } from '@/features/course/components/detail/OpenCoursePlanHero';
import { CourseSidebar } from '@/features/course/components/detail/CourseSidebar';
import { CourseDetailTabs } from '@/features/course/components/detail/CourseDetailTabs';
import { formatPlanCode, parsePlanCode } from '@/features/course/utils/plan-code';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string; code: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { code } = await params;
  const parsed = parsePlanCode(decodeURIComponent(code));
  if (!parsed) {
    return fallbackDetailMetadata('公开课详情');
  }
  try {
    const course = await getCourseDetail(parsed.courseId);
    return openCourseDetailMetadata(course, parsed.planIndex);
  } catch {
    return fallbackDetailMetadata('公开课详情');
  }
}

/**
 * 公开课开课计划详情页 — 每个场次独立 URL：/opencourse/TK-000015-1
 */
export default async function OpenCoursePlanDetailPage({ params }: Props) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('course.plan');

  const parsed = parsePlanCode(decodeURIComponent(code));
  if (!parsed) {
    notFound();
  }

  const planCode = formatPlanCode(parsed.courseId, parsed.planIndex);
  const planArrayIndex = parsed.planIndex - 1;

  let course;
  try {
    course = await getCourseDetail(parsed.courseId);
  } catch {
    notFound();
  }

  const plan = course.plans?.[planArrayIndex];
  if (!plan) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 space-y-6">
      <PageBreadcrumb
        items={[
          { label: '公开课', href: '/opencourses' },
          { label: course.title, href: `/opencourse/${course.id}.htm` },
          { label: planCode },
        ]}
      />

      <OpenCoursePlanHero course={course} plan={plan} planCode={planCode} />

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        <CourseDetailTabs
          course={course}
          activePlanCode={planCode}
          planTableTitle={t('otherPlans')}
        />
        <CourseSidebar course={course} />
      </section>
    </div>
  );
}
