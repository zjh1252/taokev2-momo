import { Link } from '@/i18n/navigation';
import { ChevronRight } from 'lucide-react';
import { InstitutionListSection } from '@/features/institution/components/list/InstitutionListSection';
import { getInstitutionList } from '@/features/institution/api/service';

export async function generateMetadata() {
  return {
    title: '培训协会 - 淘课网',
    description: '发现全国优秀培训协会，按擅长领域、行业筛选，查看评分与评价。',
  };
}

/**
 * 培训协会列表页 — 复用机构列表组件，筛选 association=true
 */
export default async function AssociationsPage() {
  const initialData = await getInstitutionList({ page: 1, size: 15, association: true }).catch(() => ({
    list: [],
    total: 0,
    page: 1,
    size: 15,
    totalPages: 0,
  }));

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      <nav className="flex text-sm text-slate-500 gap-2 items-center">
        <span>你的位置：</span>
        <Link href="/" className="hover:text-primary transition-colors">
          首页
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-slate-800 font-medium">培训协会</span>
      </nav>

      <InstitutionListSection
        initialData={initialData}
        association={true}
        basePath="/associations"
        title="培训协会"
      />
    </main>
  );
}
