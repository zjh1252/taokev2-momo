'use client';

import { CheckCircle, Play } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import type { VideoDetail } from '../../api/types';
import { VideoPurchasePanel } from './VideoPurchasePanel';
import { useVideoPlayback } from '../../context/video-playback-context';

interface VideoPurchaseSectionProps {
  video: VideoDetail;
}

function WatchNowButton({ videoId }: { videoId: number }) {
  return (
    <Link
      href={ROUTES.videoPlay(videoId)}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary/90 transition-colors"
    >
      <Play className="size-4 fill-current" />
      立即观看
    </Link>
  );
}

/** 购买区域：免费/已购/自有展示状态，否则展示购买面板 */
export function VideoPurchaseSection({ video }: VideoPurchaseSectionProps) {
  const { accessible, isFree, isOwner } = useVideoPlayback();

  if (isFree) {
    return (
      <div>
        <div className="text-3xl font-bold text-green-600 mb-2">免费</div>
        <p className="text-sm text-green-600 text-center">免费课程，可直接观看</p>
        <WatchNowButton videoId={video.id} />
      </div>
    );
  }

  if (isOwner) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="size-6 text-blue-500" />
          <span className="text-xl font-bold text-blue-600">我发布的</span>
        </div>
        <p className="text-sm text-blue-600 text-center">您发布的课程，可直接观看所有章节</p>
        <WatchNowButton videoId={video.id} />
      </div>
    );
  }

  if (accessible) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="size-6 text-green-500" />
          <span className="text-xl font-bold text-green-600">已解锁</span>
        </div>
        <p className="text-sm text-green-600 text-center">已购买，可直接观看所有章节</p>
        <WatchNowButton videoId={video.id} />
      </div>
    );
  }

  return <VideoPurchasePanel video={video} />;
}
