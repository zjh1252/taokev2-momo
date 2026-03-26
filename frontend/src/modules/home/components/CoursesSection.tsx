import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { SectionHeader } from './SectionHeader';
import type { InternalCourse } from '../types';

interface CoursesSectionProps {
  courses: InternalCourse[];
}

export function CoursesSection({ courses }: CoursesSectionProps) {
  const t = useTranslations('home');

  return (
    <section>
      <SectionHeader title={t('courses.sectionTitle')} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}

function CourseCard({ course }: { course: InternalCourse }) {
  const t = useTranslations('home');

  return (
    <Link
      href={`/courses/${course.id}`}
      className="group bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* 封面 */}
      <div className="relative h-40 bg-muted">
        <Image
          src={course.image}
          alt={course.title}
          fill
          className="object-cover"
        />
      </div>

      {/* 内容 */}
      <div className="p-4">
        <h4 className="font-bold text-foreground text-sm leading-snug line-clamp-2 mb-1">
          {course.title}
        </h4>
        <p className="text-muted-foreground text-xs mb-3">{course.subtitle}</p>

        <div className="flex items-center justify-between">
          {/* 讲师 */}
          <div className="flex items-center gap-2">
            <Image
              src={course.instructorAvatar}
              alt={course.instructorName}
              width={24}
              height={24}
              className="rounded-full"
            />
            <span className="text-xs text-muted-foreground">
              {course.instructorName}
            </span>
          </div>

          {/* 成功案例数 */}
          <span className="text-xs text-primary font-medium">
            {t('courses.successCases', { count: course.successCaseCount })}
          </span>
        </div>
      </div>
    </Link>
  );
}
