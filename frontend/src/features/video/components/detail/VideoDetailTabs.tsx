'use client';

import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { MaterialLinkSection } from '@/components/material-link-section';
import { resolveRichTextHtml } from '@/lib/rich-text';
import { VideoRelatedCourses } from './VideoRelatedCourses';
import { VideoCommentsSection } from './VideoCommentsSection';
import { VideoSeriesVideoList } from './VideoSeriesVideoList';
import type { VideoDetail } from '../../api/types';

interface VideoDetailTabsProps {
  video: VideoDetail;
}

export function VideoDetailTabs({ video }: VideoDetailTabsProps) {
  const hasSeriesPackage = Boolean(video.hasSeriesPackage);
  const tabs = hasSeriesPackage
    ? [
        { key: 'intro', label: '视频介绍' },
        { key: 'series', label: '系列介绍' },
      ]
    : [{ key: 'intro', label: '视频介绍' }];

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const activeTab =
    searchParams.get('tab') === 'series' && hasSeriesPackage ? 'series' : 'intro';

  const switchTab = (key: string) => {
    if (key === 'series' && hasSeriesPackage) {
      router.replace(`${pathname}?tab=series`, { scroll: false });
      return;
    }
    router.replace(pathname, { scroll: false });
  };

  const resolvedIntroHtml = resolveRichTextHtml(video.intro ?? '', `${video.title}课程介绍`);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      {hasSeriesPackage ? (
        <div className="flex border-b border-slate-100">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => switchTab(tab.key)}
              className={`px-8 py-4 text-sm font-medium transition-colors relative ${
                activeTab === tab.key
                  ? 'text-primary'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      ) : null}

      <div className="p-6 space-y-8">
        {activeTab === 'intro' && (
          <>
            <section>
              {!hasSeriesPackage ? (
                <h2 className="text-base font-bold text-primary mb-4">视频介绍</h2>
              ) : null}
              {video.intro ? (
                <div
                  className="prose prose-slate max-w-none prose-sm"
                  dangerouslySetInnerHTML={{ __html: resolvedIntroHtml }}
                />
              ) : (
                <p className="text-slate-400 text-center py-8 text-sm">暂无视频介绍</p>
              )}
            </section>

            <MaterialLinkSection
              courseTitle={video.title}
              materialUrl={video.materialUrl}
              sourceTexts={[video.materialText, video.intro]}
            />

            <VideoRelatedCourses videoId={video.id} />

            <section>
              <h2 className="text-base font-bold text-primary mb-4">{video.title}的评论</h2>
              <VideoCommentsSection videoId={video.id} />
            </section>
          </>
        )}

        {activeTab === 'series' && hasSeriesPackage && (
          <>
            <section>
              <VideoSeriesVideoList videoId={video.id} />
            </section>

            <VideoRelatedCourses videoId={video.id} />

            <section>
              <h2 className="text-base font-bold text-primary mb-4">{video.title}的评论</h2>
              <VideoCommentsSection videoId={video.id} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
