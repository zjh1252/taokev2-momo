'use client';

import { useState } from 'react';
import { ChevronDown, Play, Lock, Eye } from 'lucide-react';
import { toast } from 'sonner';
import type { VideoSeries, VideoChapter } from '../../api/types';
import { cn } from '@/lib/utils';
import { useVideoPlayback } from '../../context/video-playback-context';

interface VideoChapterListProps {
  seriesList: VideoSeries[];
  standaloneChapters: VideoChapter[];
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function VideoChapterList({ seriesList, standaloneChapters }: VideoChapterListProps) {
  const { setPlaybackSrc } = useVideoPlayback();

  const [expandedSeries, setExpandedSeries] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    seriesList.forEach((s) => { init[s.id] = true; });
    return init;
  });

  const toggleSeries = (id: number) => {
    setExpandedSeries((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalChapters = seriesList.reduce((sum, s) => sum + (s.chapters?.length || 0), 0) + standaloneChapters.length;

  if (totalChapters === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        暂无章节内容
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 系列 + 章节 */}
      {seriesList.map((series) => (
        <div key={series.id} className="border border-slate-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSeries(series.id)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-800">{series.title}</span>
              <span className="text-xs text-slate-400">({series.chapters?.length || 0} 个章节)</span>
            </div>
            <ChevronDown
              className={cn('size-4 text-slate-400 transition-transform', expandedSeries[series.id] && 'rotate-180')}
            />
          </button>
          {expandedSeries[series.id] && series.chapters && series.chapters.length > 0 && (
            <div className="divide-y divide-slate-100">
              {series.chapters.map((chapter, idx) => (
                <ChapterRow
                  key={chapter.id}
                  chapter={chapter}
                  index={idx + 1}
                  onPlay={(url, title) => setPlaybackSrc(url, title)}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* 独立章节 */}
      {standaloneChapters.length > 0 && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          {seriesList.length > 0 && (
            <div className="px-4 py-3 bg-slate-50">
              <span className="font-medium text-slate-800">其他章节</span>
            </div>
          )}
          <div className="divide-y divide-slate-100">
            {standaloneChapters.map((chapter, idx) => (
              <ChapterRow
                key={chapter.id}
                chapter={chapter}
                index={idx + 1}
                onPlay={(url, title) => setPlaybackSrc(url, title)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChapterRow({
  chapter,
  index,
  onPlay,
}: {
  chapter: VideoChapter;
  index: number;
  onPlay: (url: string, title: string) => void;
}) {
  const url = chapter.videoUrl?.trim();

  const handleClick = () => {
    if (!url) {
      toast.info('该章节暂无视频文件');
      return;
    }
    // TODO: 已购/免费/试看校验通过后，再允许 onPlay；当前为便于联调，只要有地址即可切换
    onPlay(url, chapter.title);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left disabled:opacity-60"
    >
      <span className="text-sm text-slate-400 w-6 text-center shrink-0">{index}</span>
      {chapter.isPreview === 1 ? (
        <Play className="size-4 text-primary shrink-0" />
      ) : (
        <Lock className="size-4 text-slate-300 shrink-0" />
      )}
      <span className="text-sm text-slate-700 flex-1 truncate">{chapter.title}</span>
      {chapter.isPreview === 1 && (
        <span className="text-xs text-primary flex items-center gap-0.5">
          <Eye className="size-3" />
          试看
        </span>
      )}
      {chapter.duration > 0 && (
        <span className="text-xs text-slate-400 shrink-0">{formatDuration(chapter.duration)}</span>
      )}
    </button>
  );
}
