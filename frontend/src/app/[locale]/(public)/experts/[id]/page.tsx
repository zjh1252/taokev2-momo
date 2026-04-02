import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getTrainerDetail } from '@/features/trainer/api/service';
import { TrainerHero } from '@/features/trainer/components/detail/TrainerHero';
import { TrainerDetailContent } from '@/features/trainer/components/detail/TrainerDetailContent';
import { TrainerSidebar } from '@/features/trainer/components/detail/TrainerSidebar';
import {
  mockCourses,
  mockCases,
  mockClips,
  mockReviews,
  mockBooks,
  mockRelatedTrainers,
} from '@/features/trainer/data/mock';

interface Props {
  params: Promise<{ id: string }>;
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
 * 专家详情页 — SSR，主数据从 GET /trainers/{id} 获取，
 * 子页签（课程/案例/评价等）暂用 mock 数据。
 */
export default async function TrainerDetailPage({ params }: Props) {
  const { id } = await params;
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

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6 space-y-6">
      {/* 顶部 Hero 信息卡 */}
      <TrainerHero trainer={trainer} />

      {/* 主体：左侧内容 + 右侧侧边栏 */}
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_300px] gap-6 items-start">
        <div>
          <TrainerDetailContent
            trainer={trainer}
            courses={mockCourses}
            cases={mockCases}
            clips={mockClips}
            reviews={mockReviews}
            books={mockBooks}
            relatedTrainers={mockRelatedTrainers}
          />
        </div>
        <TrainerSidebar trainer={trainer} relatedTrainers={mockRelatedTrainers} />
      </section>
    </div>
  );
}
