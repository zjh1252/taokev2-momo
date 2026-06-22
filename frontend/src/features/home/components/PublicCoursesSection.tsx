import { BookOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { SafeImage } from '@/components/safe-image';
import { resolveImageSrc } from '@/lib/media';
import { SectionHeader } from './SectionHeader';
import type { PublicCourse } from '../types';

interface PublicCoursesSectionProps {
  courses: PublicCourse[];
}

/**
 * 线下公开课 — 左图 240px + 信息用 grid 2 列 + 右侧按钮
 */
export function PublicCoursesSection({ courses }: PublicCoursesSectionProps) {
  const t = useTranslations('home');

  return (
    <section>
      <SectionHeader
        title={t('publicCourses.sectionTitle')}
        viewMoreHref="/opencourse"
        viewMoreText={t('publicCourses.viewMore')}
        icon={<BookOpen className="size-6 text-yellow-500" />}
      />

      <div className="space-y-4">
        {courses.map((course) => (
          <PublicCourseItem key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}

function PublicCourseItem({ course }: { course: PublicCourse }) {
  const t = useTranslations('home');
  const coverSrc = resolveImageSrc(course.coverUrl);

  return (
    <div className="bg-white rounded-lg p-6 flex flex-col md:flex-row items-center gap-8 shadow-sm hover:shadow-md transition-all border border-slate-50 group">
      <div className="w-full md:w-[240px] h-[160px] rounded-lg overflow-hidden shrink-0 relative bg-slate-100">
        {coverSrc ? (
          <SafeImage
            src={coverSrc}
            alt={course.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : null}
      </div>

      <div className="flex-1 flex flex-col gap-4 min-w-0 w-full">
        <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-2">
          {course.title}
        </h3>
        <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-500">
          <div>
            {t('publicCourses.labels.instructor')}：{course.instructor}
          </div>
          <div>
            {t('publicCourses.labels.city')}：{course.city}
          </div>
          <div>
            {t('publicCourses.labels.startDate')}：{course.startDate}
          </div>
          <div>
            {t('publicCourses.labels.duration')}：
            {course.durationDays != null
              ? t('publicCourses.durationDays', { count: course.durationDays })
              : '-'}
          </div>
        </div>
      </div>

      <div className="shrink-0">
        <Link
          href={`/opencourse/${course.id}.htm`}
          className="px-6 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-md inline-block"
        >
          {t('publicCourses.viewDetail')}
        </Link>
      </div>
    </div>
  );
}
