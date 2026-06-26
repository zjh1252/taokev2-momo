'use client';

import { ExternalLink, Play } from 'lucide-react';
import { SafeImage } from '@/components/safe-image';
import { DEFAULT_VIDEO_COVER } from '@/lib/media';

type ThirdPartyWatchPanelProps = {
  watchUrl: string;
  watchLabel: string;
  title?: string | null;
  poster?: string | null;
  className?: string;
};

/**
 * 第三方托管视频（优酷/土豆/B 站等）：页内 iframe 常被平台拒绝，统一用封面 + 站外打开。
 */
export function ThirdPartyWatchPanel({
  watchUrl,
  watchLabel,
  title,
  poster,
  className,
}: ThirdPartyWatchPanelProps) {
  return (
    <div
      className={
        className ??
        'relative flex h-full min-h-[200px] w-full flex-col items-center justify-center overflow-hidden bg-slate-950'
      }
    >
      {poster ? (
        <SafeImage
          src={poster}
          alt={title ?? '视频封面'}
          fill
          className="object-cover opacity-40"
          fallback={DEFAULT_VIDEO_COVER}
        />
      ) : null}
      <div className="relative z-10 flex max-w-sm flex-col items-center gap-4 px-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-white/10 backdrop-blur">
          <Play className="size-7 fill-white text-white" />
        </div>
        <p className="text-sm leading-relaxed text-white/85">
          该视频托管于第三方平台，请在原站观看（页内嵌入常因平台策略无法播放）。
        </p>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
        >
          <ExternalLink className="size-4" />
          {watchLabel}
        </a>
      </div>
    </div>
  );
}
