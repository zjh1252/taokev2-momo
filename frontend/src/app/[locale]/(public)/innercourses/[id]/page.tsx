import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { setRequestLocale } from 'next-intl/server';
import { getCourseDetail } from '@/features/course/api/service';
import { CourseHero } from '@/features/course/components/detail/CourseHero';
import { CourseSidebar } from '@/features/course/components/detail/CourseSidebar';
import { CourseDetailTabs } from '@/features/course/components/detail/CourseDetailTabs';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const course = await getCourseDetail(Number(id));
    return {
      title: `${course.title} - 内训课详情 - 淘课网`,
      description: course.audience || course.title,
    };
  } catch {
    return { title: '内训课详情 - 淘课网' };
  }
}

/**
 * 内训课详情页 — SSR，主数据从 GET /courses/{id} 获取
 */
export default async function InnerCourseDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const courseId = Number(id);

  if (isNaN(courseId)) {
    notFound();
  }

  let course;
  try {
    course = await getCourseDetail(courseId);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 space-y-6">
      {/* 面包屑导航 — 首页 > 内训课 > 当前课程 */}
      <PageBreadcrumb
        items={[
          { label: '内训课', href: '/innercourses' },
          { label: course.title || '内训课详情' },
        ]}
      />

      <CourseHero course={course} />

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        <CourseDetailTabs course={course} />
        <CourseSidebar course={course} />
      </section>
    </div>
  );
}
