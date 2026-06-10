'use client';

import { useState, useMemo } from 'react';
import { VideoChapterList } from './VideoChapterList';
import type { VideoDetail } from '../../api/types';
import { cn } from '@/lib/utils';
import { resolveImageSrc } from '@/lib/media';

interface VideoDetailTabsProps {
  video: VideoDetail;
}

const TABS = [
  { key: 'intro', label: '课程介绍' },
  { key: 'chapters', label: '课程目录' },
] as const;

type TabKey = typeof TABS[number]['key'];

export function VideoDetailTabs({ video }: VideoDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('intro');

  // 将 intro HTML 中的图片 src 转换为可访问的完整 URL
  const resolvedIntroHtml = useMemo(() => {
    if (!video.intro) return '';
    try {
      const doc = new DOMParser().parseFromString(video.intro, 'text/html');
      doc.querySelectorAll('img').forEach((img) => {
        const src = img.getAttribute('src');
        if (src) {
          img.setAttribute('src', resolveImageSrc(src));
        }
      });
      return doc.body.innerHTML;
    } catch {
      return video.intro;
    }
  }, [video.intro]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Tab 导航 */}
      <div className="flex border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.key
                ? 'text-primary border-primary'
                : 'text-slate-500 border-transparent hover:text-slate-700',
            )}
          >
            {tab.label}
            {tab.key === 'chapters' && (
              <span className="ml-1 text-xs text-slate-400">({video.totalEpisodes})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div className="p-6">
        {activeTab === 'intro' && (
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4">课程介绍</h2>
            {video.intro ? (
              <div
                className="prose prose-slate max-w-none prose-sm"
                dangerouslySetInnerHTML={{ __html: resolvedIntroHtml }}
              />
            ) : (
              <p className="text-slate-400 text-center py-8">暂无课程介绍</p>
            )}
          </section>
        )}

        {activeTab === 'chapters' && (
          <section>
            <h3 className="text-base font-bold text-slate-900 mb-4">课程章节目录</h3>
          <VideoChapterList
            seriesList={video.seriesList || []}
            standaloneChapters={video.standaloneChapters || []}
          />
          </section>
        )}
      </div>
    </div>
  );
}
