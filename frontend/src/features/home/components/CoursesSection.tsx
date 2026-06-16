import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { SafeImage } from '@/components/safe-image';
import { DEFAULT_COURSE_COVER } from '@/lib/media';
import { SectionHeader } from './SectionHeader';
import type { InternalCourse } from '../types';

interface CoursesSectionProps {
  courses: InternalCourse[];
}

const COURSE_FALLBACK_COVERS = [
  '/statics/images/course-1.jpg',
  '/statics/images/case-1.jpg',
  '/statics/images/public-course-1.jpg',
  '/statics/images/hero-banner.jpg',
  '/statics/images/case-2.jpg',
  DEFAULT_COURSE_COVER,
];

function courseFallback(course: InternalCourse): string {
  return COURSE_FALLBACK_COVERS[Math.abs(course.id) % COURSE_FALLBACK_COVERS.length];
}

/**
 * 热门内训课 — 2 列横向图文卡片（左图右文），共 6 张
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}

function CourseCard({ course }: { course: InternalCourse }) {
  const coverSrc = course.coverUrl || course.image;

  return (
    <Link
      href={`/inhousecourse/${course.id}.htm`}
      className="bg-white rounded-lg overflow-hidden flex group border border-slate-100 hover:border-primary transition-all shadow-sm h-40"
    >
      <div className="w-1/3 overflow-hidden relative shrink-0 bg-slate-100">
        <SafeImage
          src={coverSrc}
          fallback={courseFallback(course)}
          alt={course.title}
          width={240}
          height={160}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
      </div>

      <div className="p-5 flex flex-col flex-1 min-w-0">
        <h4 className="font-bold text-base mb-2 line-clamp-2 text-slate-800 group-hover:text-primary transition-colors">
          {course.title}
        </h4>
        <p className="text-[13px] text-slate-500 mb-4">{course.subtitle}</p>
        <div className="mt-auto">
          <span className="text-[13px] text-slate-500">
            {course.instructorName} • {course.instructorDesc}
          </span>
        </div>
      </div>
    </Link>
  );
}
