'use client';

import { Video } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import type { VideoSeries, VideoChapter } from '../../api/types';
import { useVideoPlayback } from '../../context/video-playback-context';

interface VideoChapterPanelProps {
  seriesList: VideoSeries[];
  standaloneChapters: VideoChapter[];
}

type PanelRow =
  | { kind: 'header'; title: string }
  | { kind: 'chapter'; chapter: VideoChapter; episodeNo: number };

function buildRows(seriesList: VideoSeries[], standaloneChapters: VideoChapter[]): PanelRow[] {
  const rows: PanelRow[] = [];
  let episodeNo = 0;

  for (const series of seriesList) {
    const chapters = series.chapters ?? [];
    if (chapters.length === 0) continue;
    if (seriesList.length > 1 || standaloneChapters.length > 0) {
      rows.push({ kind: 'header', title: series.title });
    }
    for (const chapter of chapters) {
      episodeNo += 1;
      rows.push({ kind: 'chapter', chapter, episodeNo });
    }
  }

  if (standaloneChapters.length > 0 && seriesList.length > 0) {
    rows.push({ kind: 'header', title: '其他章节' });
  }
  for (const chapter of standaloneChapters) {
    episodeNo += 1;
    rows.push({ kind: 'chapter', chapter, episodeNo });
  }

  return rows;
}

function formatMinutes(seconds: number): string {
  if (seconds <= 0) return '—';
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `${minutes}分钟`;
}

export function VideoChapterPanel({ seriesList, standaloneChapters, videoId }: VideoChapterPanelProps & { videoId?: number }) {
  const router = useRouter();
  const { selectChapter, accessible } = useVideoPlayback();
  const rows = buildRows(seriesList, standaloneChapters);

  if (rows.length === 0) {
    return <p className="text-center py-10 text-slate-400 text-sm">暂无章节内容</p>;
  }

  const handleWatch = (chapter: VideoChapter) => {
    if (!accessible) {
      toast.warning('需要购买才能播放');
      return;
    }
    if (videoId) {
      router.push(ROUTES.videoPlay(videoId, chapter.id));
      return;
    }
    selectChapter(chapter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden max-h-[520px] overflow-y-auto">
      {rows.map((row, idx) => {
        if (row.kind === 'header') {
          return (
            <div
              key={`header-${row.title}-${idx}`}
              className="px-4 py-2.5 bg-slate-50 text-sm font-medium text-slate-700 border-b border-slate-100"
            >
              {row.title}
            </div>
          );
        }

        const { chapter, episodeNo } = row;
        return (
          <div
            key={chapter.id}
            className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80"
          >
            <span className="size-2 rounded-full border border-slate-300 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-800 truncate">
                第{episodeNo}节 {chapter.title}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <Video className="size-3.5 text-orange-500 shrink-0" />
                时长{formatMinutes(chapter.duration)}
                {chapter.isPreview === 1 && !accessible && (
                  <span className="ml-2 text-primary">可试看</span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleWatch(chapter)}
              className="shrink-0 px-4 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 rounded transition-colors"
            >
              马上观看
            </button>
          </div>
        );
      })}
    </div>
  );
}
