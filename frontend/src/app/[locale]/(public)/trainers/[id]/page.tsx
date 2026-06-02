import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import {
  getTrainerDetail,
  getTrainerCourses,
  getTrainerVideos,
  getTrainerApprovedCases,
  getTrainerBooks,
} from '@/features/trainer/api/service';
import { TrainerHero } from '@/features/trainer/components/detail/TrainerHero';
import { TrainerDetailContent } from '@/features/trainer/components/detail/TrainerDetailContent';
import { TrainerSidebar } from '@/features/trainer/components/detail/TrainerSidebar';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const trainer = await getTrainerDetail(Number(id));
    return {
      title: `${trainer.name} - 专家详情 - 淘课网`,
      description: trainer.title || trainer.bio?.substring(0, 120),
    };
  } catch {
    return { title: '专家详情 - 淘课网' };
  }
}

/**
 * 专家详情页 — SSR
 * <p>主数据来自 GET /trainers/{id}；主讲课程/案例/录播课/著作并发拉取，
 * 学员评价由 TrainerDetailContent 内部按需懒加载。</p>
 */
export default async function TrainerDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const trainerId = Number(id);

  if (isNaN(trainerId)) {
    notFound();
  }

  let trainer;
  try {
    trainer = await getTrainerDetail(trainerId);
  } catch {
    notFound();
  }

  // 并发拉取子页签数据
  const [coursesPage, videosPage, cases, books] = await Promise.all([
    getTrainerCourses(trainerId, 1, 50).catch(() => ({ list: [], total: 0, page: 1, size: 50, totalPages: 0 })),
    getTrainerVideos(trainerId, 1, 50).catch(() => ({ list: [], total: 0, page: 1, size: 50, totalPages: 0 })),
    getTrainerApprovedCases(trainerId).catch(() => []),
    getTrainerBooks(trainerId).catch(() => []),
  ]);

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6 space-y-6">
      {/* 面包屑导航 — 首页 > 培训专家 > 当前专家 */}
      <PageBreadcrumb
        items={[
          { label: '培训专家', href: '/trainers' },
          { label: trainer.name || '专家详情' },
        ]}
      />

      <TrainerHero trainer={trainer} />

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_300px] gap-6 items-start">
        <div>
          <TrainerDetailContent
            trainer={trainer}
            courses={coursesPage.list}
            cases={cases}
            videos={videosPage.list}
            books={books}
          />
        </div>
        <TrainerSidebar trainer={trainer} />
      </section>
    </div>
  );
}
