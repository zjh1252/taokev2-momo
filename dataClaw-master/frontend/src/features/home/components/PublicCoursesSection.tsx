import { BookOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
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
        viewMoreHref="/opencourses"
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

  return (
    <div className="bg-white rounded-lg p-6 flex flex-col md:flex-row items-center gap-8 shadow-sm hover:shadow-md transition-all border border-slate-50 group">
      {/* 左侧图片 */}
      <div className="w-full md:w-[240px] h-[160px] rounded-lg overflow-hidden shrink-0">
        <Image
          src={course.image}
          alt={course.title}
          width={240}
          height={160}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
      </div>

      {/* 中间详情 */}
      <div className="flex-1 flex flex-col gap-4">
        <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-500">
          <div>
            {t('publicCourses.labels.organizer')}：{course.organizer}
          </div>
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
            {t('publicCourses.durationDays', { count: course.durationDays })}
          </div>
        </div>
      </div>

      {/* 右侧按钮 */}
      <div className="flex gap-3 shrink-0">
        <Link
          href={`/opencourses/${course.id}`}
          className="px-6 py-2 rounded-lg border border-primary text-primary font-bold text-sm bg-white hover:bg-primary hover:text-white transition-all"
        >
          {t('publicCourses.consult')}
        </Link>
        <Link
          href={`/opencourses/${course.id}`}
          className="px-6 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-md"
        >
          {t('publicCourses.viewDetail')}
        </Link>
      </div>
    </div>
  );
}
