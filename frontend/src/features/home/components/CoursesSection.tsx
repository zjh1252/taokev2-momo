import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { SafeImage } from '@/components/safe-image';
import { SectionHeader } from './SectionHeader';
import type { InternalCourse } from '../types';

interface CoursesSectionProps {
  courses: InternalCourse[];
}

/**
 * 热门内训课 - 2 列横向图文卡片，共 6 张
 */
export function CoursesSection({ courses }: CoursesSectionProps) {
  const t = useTranslations('home');

  return (
    <section>
      <SectionHeader
        title={t('courses.sectionTitle')}
        viewMoreHref="/inhousecourse"
        viewMoreText={t('experts.viewMore')}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}

function CourseCard({ course }: { course: InternalCourse }) {
  return (
    <Link
      href={`/inhousecourse/${course.id}.htm`}
      className="group flex min-h-40 flex-col overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm transition-all hover:border-slate-200 hover:shadow-md sm:min-h-0 sm:flex-row md:h-40"
    >
      <div className="relative h-40 w-full shrink-0 overflow-hidden bg-slate-100 sm:h-auto sm:w-[198px] md:w-[198px]">
        <SafeImage
          src={course.coverUrl}
          alt={course.title}
          fill
          apiResolved
          className="object-cover object-top transition-transform group-hover:scale-105"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col px-5 py-6">
        <h4 className="mb-3 line-clamp-1 text-[17px] font-bold leading-6 text-slate-950 transition-colors group-hover:text-primary">
          {course.title}
        </h4>
        <p className="text-sm leading-5 text-slate-500">{course.subtitle}</p>
        <p className="mt-auto line-clamp-2 text-sm leading-6 text-slate-500">
          {course.instructorName} · {course.instructorDesc}
        </p>
      </div>
    </Link>
  );
}
