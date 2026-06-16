'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { SafeImage } from '@/components/safe-image';
import { getVideoSeriesPackage } from '../../api/service';
import type { VideoSeriesItem, VideoSeriesPackage } from '../../api/types';
import { DEFAULT_VIDEO_COVER } from '@/lib/media';

interface VideoSeriesVideoListProps {
  videoId: number;
}

function SeriesVideoCard({ item }: { item: VideoSeriesItem }) {
  return (
    <div className="relative pl-8">
      <span className="absolute left-0 top-1/2 -translate-y-1/2 size-2.5 rounded-full border-2 border-slate-300 bg-white z-10" />
      <span className="absolute left-[4px] top-1/2 w-4 h-px bg-slate-300" />

      <div className="flex gap-4 border border-slate-200 rounded-lg p-3 bg-white hover:border-primary/30 transition-colors">
        <div className="relative w-[140px] h-[88px] shrink-0 rounded overflow-hidden bg-slate-100">
          <SafeImage
            src={item.coverUrl || DEFAULT_VIDEO_COVER}
            alt={item.title}
            fill
            className="object-cover"
            sizes="140px"
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
            {item.title}
          </h3>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1 text-xs text-slate-600">
              <p>
                价格：
                <span className="text-primary font-semibold">
                  ¥ {Number(item.price ?? 0).toFixed(2)}
                </span>
              </p>
              <p>主讲教师：{item.teacherName || '佚名'}</p>
              <p>学习人数：{item.studentCount ?? 0}人</p>
            </div>

            <Link
              href={ROUTES.videoPlay(item.id)}
              className="shrink-0 px-4 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 rounded transition-colors"
            >
              马上观看
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VideoSeriesVideoList({ videoId }: VideoSeriesVideoListProps) {
  const [data, setData] = useState<VideoSeriesPackage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getVideoSeriesPackage(videoId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [videoId]);

  if (loading) {
    return <p className="text-center py-10 text-slate-400 text-sm">加载系列课程中…</p>;
  }

  if (!data?.videos?.length) {
    return <p className="text-center py-10 text-slate-400 text-sm">暂无系列课程</p>;
  }

  return (
    <div>
      {data.packageName ? (
        <h3 className="text-sm font-medium text-slate-700 mb-4">{data.packageName}</h3>
      ) : null}

      <div className="relative space-y-4">
        <span className="absolute left-[4px] top-3 bottom-3 w-px bg-slate-200" />
        {data.videos.map((item) => (
          <SeriesVideoCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
