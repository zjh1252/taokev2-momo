import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { SectionHeader } from './SectionHeader';
import type { InternalCourse } from '../types';

interface CoursesSectionProps {
  courses: InternalCourse[];
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
        viewMoreHref="/innercourses"
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
  return (
    <Link
      href={`/innercourses/${course.id}`}
      className="bg-white rounded-lg overflow-hidden flex group border border-slate-100 hover:border-primary transition-all shadow-sm h-40"
    >
      {/* 左侧封面 */}
      <div className="w-1/3 overflow-hidden">
        <Image
          src={course.image}
          alt={course.title}
          width={240}
          height={160}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
      </div>

      {/* 右侧内容 */}
      <div className="p-5 flex flex-col flex-1">
        <h4 className="font-bold text-base mb-2 line-clamp-2 text-slate-800 group-hover:text-primary transition-colors">
          {course.title}
        </h4>
        <p className="text-[13px] text-slate-500 mb-4">{course.subtitle}</p>
        <div className="mt-auto flex items-center gap-2">
          <Image
            src={course.instructorAvatar}
            alt={course.instructorName}
            width={24}
            height={24}
            className="rounded-full object-cover"
          />
          <span className="text-[13px] text-slate-500">
            {course.instructorName} • {course.instructorDesc}
          </span>
        </div>
      </div>
    </Link>
  );
}
