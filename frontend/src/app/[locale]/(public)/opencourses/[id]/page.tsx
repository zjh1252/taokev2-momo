import { notFound } from 'next/navigation';
import { openCourseDetailMetadata, fallbackDetailMetadata } from '@/lib/seo';
import { setRequestLocale } from 'next-intl/server';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { DetailViewRecorder } from '@/components/detail-view-recorder';
import { getCourseDetail } from '@/features/course/api/service';
import { CourseHero } from '@/features/course/components/detail/CourseHero';
import { ExpiredCourseBanner } from '@/features/course/components/detail/ExpiredCourseBanner';
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
    return openCourseDetailMetadata(course);
  } catch {
    return fallbackDetailMetadata('公开课详情');
  }
}

/**
 * 公开课详情页 — SSR，主数据从 GET /courses/{id} 获取
 */
export default async function OpenCourseDetailPage({ params }: Props) {
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
      <DetailViewRecorder resourceType="course" resourceId={course.id} viewCount={course.viewCount} />
      {/* 面包屑导航 — 首页 > 公开课 > 当前课程 */}
      <PageBreadcrumb
        items={[
          { label: '公开课', href: '/opencourses' },
          { label: course.title || '公开课详情' },
        ]}
      />

      <ExpiredCourseBanner show={Boolean(course.isOverdue)} />

      <CourseHero course={course} />

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        <CourseDetailTabs course={course} />
        <CourseSidebar course={course} />
      </section>
    </div>
  );
}
