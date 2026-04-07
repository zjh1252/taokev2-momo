import { Link } from '@/i18n/navigation';
import { ChevronRight } from 'lucide-react';
import { InstitutionListSection } from '@/features/institution/components/list/InstitutionListSection';
import { getInstitutionList } from '@/features/institution/api/service';

export async function generateMetadata() {
  return {
    title: '培训机构 - 淘课网',
    description: '发现全国优秀培训机构，按擅长领域、行业筛选，查看评分与评价。',
  };
}

/**
 * 机构列表页 — SSR 首屏数据 + 客户端筛选交互
 */
export default async function InstitutionsPage() {
  const initialData = await getInstitutionList({ page: 1, size: 15 }).catch(() => ({
    list: [],
    total: 0,
    page: 1,
    size: 15,
    totalPages: 0,
  }));

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      {/* 面包屑导航 */}
      <nav className="flex text-sm text-slate-500 gap-2 items-center">
        <span>你的位置：</span>
        <Link href="/" className="hover:text-primary transition-colors">
          首页
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-slate-800 font-medium">培训机构</span>
      </nav>

      <InstitutionListSection initialData={initialData} />
    </main>
  );
}
