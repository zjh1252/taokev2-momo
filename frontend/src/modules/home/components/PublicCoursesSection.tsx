import { BookOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { SectionHeader } from './SectionHeader';
import type { PublicCourse } from '../types';

interface PublicCoursesSectionProps {
  courses: PublicCourse[];
}

export function PublicCoursesSection({ courses }: PublicCoursesSectionProps) {
  const t = useTranslations('home');

  return (
    <section>
      <SectionHeader
        title={t('publicCourses.sectionTitle')}
        viewMoreHref="/public-courses"
        viewMoreText={t('publicCourses.viewMore')}
        icon={<BookOpen className="size-6 text-primary" />}
      />

      <div className="space-y-4">
        {courses.map((course) => (
          <PublicCourseItem key={course.id} course={course} />
        ))}
      </div>

      {/* 加载更多 */}
      <div className="flex justify-center mt-8">
        <button
          type="button"
          className="border border-border text-muted-foreground font-medium px-8 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm"
        >
          {t('publicCourses.loadMore')}
        </button>
      </div>
    </section>
  );
}

function PublicCourseItem({ course }: { course: PublicCourse }) {
  const t = useTranslations('home');

  return (
    <div className="bg-card rounded-lg border border-border p-5 flex flex-col md:flex-row items-start md:items-center gap-5 hover:shadow-md transition-shadow">
      {/* 左侧图片 */}
      <div className="relative w-full md:w-40 h-28 shrink-0 rounded-md overflow-hidden bg-muted">
        <Image
          src={course.image}
          alt={course.title}
          fill
          className="object-cover"
        />
      </div>

      {/* 中间详情 */}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-foreground text-base mb-3 line-clamp-1">
          {course.title}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-y-2 gap-x-4 text-sm">
          <DetailItem
            label={t('publicCourses.labels.organizer')}
            value={course.organizer}
          />
          <DetailItem
            label={t('publicCourses.labels.instructor')}
            value={course.instructor}
          />
          <DetailItem
            label={t('publicCourses.labels.city')}
            value={course.city}
          />
          <DetailItem
            label={t('publicCourses.labels.startDate')}
            value={course.startDate}
          />
          <DetailItem
            label={t('publicCourses.labels.duration')}
            value={t('publicCourses.durationDays', {
              count: course.durationDays,
            })}
          />
        </div>
      </div>

      {/* 右侧按钮 */}
      <div className="flex md:flex-col gap-2 shrink-0">
        <Link
          href={`/public-courses/${course.id}`}
          className="bg-primary text-primary-foreground font-bold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm text-center"
        >
          {t('publicCourses.consult')}
        </Link>
        <Link
          href={`/public-courses/${course.id}`}
          className="border border-border text-foreground font-medium px-5 py-2 rounded-lg hover:bg-muted transition-colors text-sm text-center"
        >
          {t('publicCourses.viewDetail')}
        </Link>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground text-xs">{label}</span>
      <p className="text-foreground font-medium text-sm truncate">{value}</p>
    </div>
  );
}
