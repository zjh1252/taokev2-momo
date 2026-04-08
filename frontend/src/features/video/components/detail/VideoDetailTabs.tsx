'use client';

import { useState } from 'react';
import { VideoChapterList } from './VideoChapterList';
import type { VideoDetail } from '../../api/types';
import { cn } from '@/lib/utils';

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
          <div>
            {video.intro ? (
              <div
                className="prose prose-slate max-w-none prose-sm"
                dangerouslySetInnerHTML={{ __html: video.intro }}
              />
            ) : (
              <p className="text-slate-400 text-center py-8">暂无课程介绍</p>
            )}
          </div>
        )}

        {activeTab === 'chapters' && (
          <VideoChapterList
            seriesList={video.seriesList || []}
            standaloneChapters={video.standaloneChapters || []}
          />
        )}
      </div>
    </div>
  );
}
