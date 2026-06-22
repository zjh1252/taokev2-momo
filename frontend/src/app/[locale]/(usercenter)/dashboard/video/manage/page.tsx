'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/lib/auth/auth-context';
import {
  getMyVideos,
  submitVideo,
  unpublishVideo,
  deleteVideo,
  type MyVideoListParams,
} from '@/features/video/api/publisher-service';
import { TrainerSwitcher } from '@/features/binding/components/trainer-switcher';
import { isDelegatingRole, selfPublishingAllowed } from '@/features/binding/lib/delegating-role';
import {
  VideoStatus,
  VideoStatusLabelMap,
  type VideoListItem,
  type VideoStatusValue,
} from '@/features/video/api/types';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Send,
  EyeOff,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_TABS: { label: string; value: number | undefined }[] = [
  { label: '全部', value: undefined },
  { label: '草稿', value: VideoStatus.DRAFT },
  { label: '待审核', value: VideoStatus.PENDING },
  { label: '已上架', value: VideoStatus.PUBLISHED },
  { label: '已驳回', value: VideoStatus.REJECTED },
  { label: '已下架', value: VideoStatus.UNPUBLISHED },
];

const STATUS_BADGE_STYLES: Record<number, string> = {
  [VideoStatus.DRAFT]: 'bg-slate-100 text-slate-600',
  [VideoStatus.PENDING]: 'bg-amber-50 text-amber-600',
  [VideoStatus.PUBLISHED]: 'bg-green-50 text-green-600',
  [VideoStatus.REJECTED]: 'bg-red-50 text-red-600',
  [VideoStatus.UNPUBLISHED]: 'bg-gray-100 text-gray-500',
};

const PAGE_SIZE = 10;

export default function ManageVideosPage() {
  const { user, activeRole } = useAuth();
  const showSwitcher = isDelegatingRole(activeRole);
  const hideSelfOption = showSwitcher && !selfPublishingAllowed(activeRole);
  const [activeTab, setActiveTab] = useState<number | undefined>(undefined);
  const [keyword, setKeyword] = useState('');
  const [videos, setVideos] = useState<VideoListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [trainerUserId, setTrainerUserId] = useState<number | undefined>(undefined);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchVideos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params: MyVideoListParams = {
        page,
        size: PAGE_SIZE,
        status: activeTab,
        keyword: keyword || undefined,
        trainerUserId,
      };
      const res = await getMyVideos(params);
      setVideos(res.list || []);
      setTotal(res.total || 0);
    } catch {
      setVideos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [user, page, activeTab, keyword, trainerUserId]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleTabChange = (val: number | undefined) => {
    setActiveTab(val);
    setPage(1);
  };

  const handleSearch = () => {
    setPage(1);
    fetchVideos();
  };

  const handleSubmit = async (id: number) => {
    if (!confirm('确定要提交审核吗？')) return;
    try {
      await submitVideo(id);
      fetchVideos();
    } catch {
      alert('提交审核失败');
    }
  };

  const handleUnpublish = async (id: number) => {
    if (!confirm('确定要下架此录播课吗？')) return;
    try {
      await unpublishVideo(id);
      fetchVideos();
    } catch {
      alert('下架失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此录播课吗？此操作不可恢复。')) return;
    try {
      await deleteVideo(id);
      fetchVideos();
    } catch {
      alert('删除失败');
    }
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      {/* 标题栏 */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-bold text-gray-800">管理录播课</h2>
        <div className="flex items-center gap-2">
          {showSwitcher && (
            <TrainerSwitcher
              value={trainerUserId}
              hideSelf={hideSelfOption}
              onChange={(uid) => {
                setTrainerUserId(uid);
                setPage(1);
              }}
            />
          )}
          <Link
            href={trainerUserId
              ? `${ROUTES.UC_VIDEOS_CREATE}?trainerUserId=${trainerUserId}`
              : ROUTES.UC_VIDEOS_CREATE}
            className="inline-flex items-center gap-1.5 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            发布新录播课
          </Link>
        </div>
      </div>

      {/* 状态 Tabs + 搜索 */}
      <div className="px-6 pt-4 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => handleTabChange(tab.value)}
              className={cn(
                'px-3.5 py-1.5 text-sm rounded-full transition-colors',
                activeTab === tab.value
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-gray-600 hover:bg-slate-200',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索录播课..."
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-gray-500 hover:bg-slate-50 transition-colors"
          >
            <Search className="size-4" />
          </button>
        </div>
      </div>

      {/* 录播课列表 */}
      <div className="px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <div className="animate-spin rounded-full size-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Play className="size-12 mb-4 text-gray-300" />
            <p className="text-sm">暂无录播课</p>
            <Link
              href={ROUTES.UC_VIDEOS_CREATE}
              className="mt-4 text-sm text-primary hover:underline"
            >
              去发布第一门录播课
            </Link>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {videos.map((video) => (
              <VideoManageCard
                key={video.id}
                video={video}
                onSubmit={handleSubmit}
                onUnpublish={handleUnpublish}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm text-gray-500 px-3">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function VideoManageCard({
  video,
  onSubmit,
  onUnpublish,
  onDelete,
}: {
  video: VideoListItem;
  onSubmit: (id: number) => void;
  onUnpublish: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const statusLabel = VideoStatusLabelMap[video.status as VideoStatusValue] || video.statusLabel;
  const badgeStyle = STATUS_BADGE_STYLES[video.status] || 'bg-slate-100 text-slate-600';
  const isDraft = video.status === VideoStatus.DRAFT;
  const isRejected = video.status === VideoStatus.REJECTED;
  const isPublished = video.status === VideoStatus.PUBLISHED;
  const isPending = video.status === VideoStatus.PENDING;

  return (
    <div className="border border-slate-200 rounded-lg p-4 flex gap-4 hover:shadow-md transition-shadow">
      {/* 封面 */}
      <div className="w-[160px] h-[100px] rounded-lg overflow-hidden bg-slate-100 shrink-0 relative">
        {video.coverUrl ? (
          <Image
            src={video.coverUrl}
            alt={video.title}
            width={160}
            height={100}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Play className="size-8" />
          </div>
        )}
        {video.totalEpisodes > 0 && (
          <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
            {video.totalEpisodes} 集
          </span>
        )}
      </div>

      {/* 信息区 */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-800 truncate">{video.title}</h3>
            <span className={cn('text-[11px] px-2 py-0.5 rounded-full shrink-0', badgeStyle)}>
              {statusLabel}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
            <span>{video.videoTypeLabel}</span>
            {video.categoryName && <span>· {video.categoryName}</span>}
            {video.teacherName && <span>· {video.teacherName}</span>}
            {video.price > 0 && <span>· ¥{video.price}</span>}
            {video.isFree === 1 && <span className="text-green-600">· 免费</span>}
          </div>
          {isRejected && (
            <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
              <AlertCircle className="size-3.5" />
              <span>审核未通过，请修改后重新提交</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
          <span>浏览 {video.viewCount}</span>
          <span>学员 {video.studentCount}</span>
          <span>创建于 {video.createdAt?.slice(0, 10)}</span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col gap-2 shrink-0 justify-center">
        {(isDraft || isRejected) && (
          <button
            type="button"
            onClick={() => onSubmit(video.id)}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            <Send className="size-3.5" />
            提交审核
          </button>
        )}
        {isPublished && (
          <button
            type="button"
            onClick={() => onUnpublish(video.id)}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-amber-300 text-amber-600 hover:bg-amber-50 transition-colors"
          >
            <EyeOff className="size-3.5" />
            下架
          </button>
        )}
        <Link
          href={`/dashboard/video/${video.id}/edit`}
          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-slate-200 text-gray-600 hover:bg-slate-50 transition-colors"
        >
          <Edit className="size-3.5" />
          编辑
        </Link>
        {video.videoType === 'SERIES' && (
          <Link
            href={`/dashboard/video/${video.id}/series`}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-slate-200 text-gray-600 hover:bg-slate-50 transition-colors"
          >
            系列管理
          </Link>
        )}
        <Link
          href={`/dashboard/video/${video.id}/chapters`}
          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-slate-200 text-gray-600 hover:bg-slate-50 transition-colors"
        >
          章节管理
        </Link>
        {!isPending && !isPublished && (
          <button
            type="button"
            onClick={() => onDelete(video.id)}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="size-3.5" />
            删除
          </button>
        )}
      </div>
    </div>
  );
}
