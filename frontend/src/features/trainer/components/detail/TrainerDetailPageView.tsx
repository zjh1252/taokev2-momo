import type { TrainerDetailPageData } from '../../api/trainer-detail-page-data';
import { DetailViewRecorder } from '@/components/detail-view-recorder';
import type { TrainerTabId } from '../../utils/routes';
import { TrainerHero } from './TrainerHero';
import { TrainerDetailContent, TrainerDetailTabs } from './TrainerDetailContent';
import { TrainerSidebar } from './TrainerSidebar';

interface TrainerDetailPageViewProps extends TrainerDetailPageData {
  activeTab: TrainerTabId;
}

export function TrainerDetailPageView({
  activeTab,
  trainer,
  courses,
  coursesTotal,
  cases,
  highlights,
  videos,
  videosTotal,
  books,
}: TrainerDetailPageViewProps) {
  return (
    <>
      <DetailViewRecorder
        resourceType="trainer"
        resourceId={trainer.id}
        viewCount={trainer.viewCount}
      />

      <TrainerHero trainer={trainer} />

      <TrainerDetailTabs
        activeTab={activeTab}
        trainer={trainer}
        coursesTotal={coursesTotal}
        casesCount={cases.length}
        highlightsCount={highlights.length}
        videosTotal={videosTotal}
        booksCount={books.length}
      />

      <div className="max-w-[1400px] mx-auto px-6 pb-6 pt-7 space-y-6">
        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_324px] gap-7 items-start">
          <div>
            <TrainerDetailContent
              activeTab={activeTab}
              trainer={trainer}
              courses={courses}
              coursesTotal={coursesTotal}
              cases={cases}
              highlights={highlights}
              videos={videos}
              videosTotal={videosTotal}
              books={books}
            />
          </div>
          <TrainerSidebar trainer={trainer} />
        </section>
      </div>
    </>
  );
}
