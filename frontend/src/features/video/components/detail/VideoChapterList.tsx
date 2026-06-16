'use client';

import { useState } from 'react';
import { ChevronDown, PlayCircle, Lock, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import type { VideoSeries, VideoChapter } from '../../api/types';
import { cn } from '@/lib/utils';
import { useVideoPlayback } from '../../context/video-playback-context';

interface VideoChapterListProps {
  seriesList: VideoSeries[];
  standaloneChapters: VideoChapter[];
  videoId?: number;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function VideoChapterList({ seriesList, standaloneChapters, videoId }: VideoChapterListProps) {
  const router = useRouter();
  const { selectChapter, accessible, currentChapterId } = useVideoPlayback();

  const handleChapterSelect = (chapter: VideoChapter) => {
    if (videoId) {
      router.push(ROUTES.videoPlay(videoId, chapter.id));
      return;
    }
    selectChapter(chapter);
  };

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
                  accessible={accessible}
                  isPlaying={currentChapterId === chapter.id}
                  onSelect={() => handleChapterSelect(chapter)}
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
              <span className="font-medium text-slate-800">录播课章节</span>
            </div>
          )}
          <div className="divide-y divide-slate-100">
            {standaloneChapters.map((chapter, idx) => (
              <ChapterRow
                key={chapter.id}
                chapter={chapter}
                index={idx + 1}
                accessible={accessible}
                isPlaying={currentChapterId === chapter.id}
                onSelect={() => handleChapterSelect(chapter)}
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
  accessible,
  isPlaying,
  onSelect,
}: {
  chapter: VideoChapter;
  index: number;
  accessible: boolean;
  isPlaying: boolean;
  onSelect: () => void;
}) {
  const handleClick = () => {
    if (!accessible) {
      toast.warning('需要购买才能播放');
      return;
    }
    onSelect();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 transition-colors text-left',
        accessible
          ? 'cursor-pointer hover:bg-primary/5 active:bg-primary/10'
          : 'cursor-not-allowed hover:bg-slate-50',
        isPlaying && 'bg-primary/10',
      )}
    >
      <span className="text-sm text-slate-400 w-6 text-center shrink-0">{index}</span>
      {accessible ? (
        <PlayCircle className={cn('size-4 shrink-0', isPlaying ? 'text-primary' : 'text-primary/70')} />
      ) : (
        <Lock className="size-4 text-slate-300 shrink-0" />
      )}
      <span className={cn(
        'text-sm flex-1 truncate',
        isPlaying ? 'text-primary font-medium' : 'text-slate-700',
      )}>
        {chapter.title}
      </span>
      {chapter.isPreview === 1 && !accessible && (
        <span className="text-xs text-primary flex items-center gap-0.5">
          <Eye className="size-3" />
          试看
        </span>
      )}
      {isPlaying && (
        <span className="text-xs text-primary font-medium shrink-0">播放中</span>
      )}
      {chapter.duration > 0 && (
        <span className="text-xs text-slate-400 shrink-0">{formatDuration(chapter.duration)}</span>
      )}
    </button>
  );
}
