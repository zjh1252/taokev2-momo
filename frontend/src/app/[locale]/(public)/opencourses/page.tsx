import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ChevronRight } from 'lucide-react';
import { OpenCourseListSection } from '@/features/course/components/open/OpenCourseListSection';
import { getCourseList, getCourseCategoryTree } from '@/features/course/api/service';
import { getInstitutionDetail } from '@/features/institution/api/service';

interface Props {
  searchParams: Promise<{ institutionId?: string }>;
}

export async function generateMetadata() {
  const t = await getTranslations('course');
  return {
    title: t('open.meta.title'),
    description: t('open.meta.description'),
  };
}

export default async function OpenCoursesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const institutionId = sp.institutionId ? Number(sp.institutionId) : undefined;
  const validInstitutionId = institutionId && !isNaN(institutionId) ? institutionId : undefined;

  const [initialData, categoryTree, institution] = await Promise.all([
    getCourseList({
      page: 1,
      size: 15,
      isOpen: true,
      institutionId: validInstitutionId,
    }).catch(() => ({
      list: [],
      total: 0,
      page: 1,
      size: 15,
      totalPages: 0,
    })),
    getCourseCategoryTree().catch(() => []),
    validInstitutionId
      ? getInstitutionDetail(validInstitutionId).catch(() => null)
      : Promise.resolve(null),
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
        <span className="text-slate-800 font-medium">公开课</span>
      </nav>

      <OpenCourseListSection
        initialData={initialData}
        categoryTree={categoryTree}
        initialInstitutionId={validInstitutionId}
        initialInstitutionName={institution?.orgName}
      />
    </main>
  );
}
