import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ChevronRight } from 'lucide-react';
import { InnerCourseListSection } from '@/features/course/components/inner/InnerCourseListSection';
import { getCourseList, getCourseCategoryTree } from '@/features/course/api/service';

export async function generateMetadata() {
  const t = await getTranslations('course');
  return {
    title: t('inner.meta.title'),
    description: t('inner.meta.description'),
  };
}

export default async function InnerCoursesPage() {
  const [initialData, categoryTree] = await Promise.all([
    getCourseList({ page: 1, size: 15, isOpen: false }).catch(() => ({
      list: [],
      total: 0,
      page: 1,
      size: 15,
      totalPages: 0,
    })),
    getCourseCategoryTree().catch(() => []),
  ]);

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      {/* 面包屑导航 */}
      <nav className="flex text-sm text-slate-500 gap-2 items-center">
        <span>你的位置：</span>
        <Link href="/" className="hover:text-primary transition-colors">
          首页
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-slate-800 font-medium">内训课</span>
      </nav>

      <InnerCourseListSection initialData={initialData} categoryTree={categoryTree} />
    </main>
  );
}
