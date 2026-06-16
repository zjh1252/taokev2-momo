'use client';

import { useCallback, useEffect, useState } from 'react';
import { Star, MessageSquareQuote } from 'lucide-react';
import { toast } from 'sonner';
import { Link, usePathname } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth/auth-context';
import { useAuthGuard } from '@/lib/auth/auth-guard-context';
import type { VideoDetail } from '../../api/types';
import { getVideoComments, submitVideoComment } from '../../api/service';
import { VideoStarDisplay } from './VideoStarDisplay';

type VideoPlayRatingCardProps = {
  video: VideoDetail;
};

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-1 cursor-pointer hover:scale-110 transition-transform"
          aria-label={`${star} 星`}
        >
          <Star
            className={`size-8 ${
              star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function VideoPlayRatingCard({ video }: VideoPlayRatingCardProps) {
  const { user } = useAuth();
  const { requireAuth } = useAuthGuard();
  const pathname = usePathname();
  const [commentTotal, setCommentTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loginHref = `${ROUTES.LOGIN}?redirect=${encodeURIComponent(pathname)}`;
  const displayTitle = video.title;

  useEffect(() => {
    getVideoComments(video.id, 1, 1)
      .then((page) => setCommentTotal(page.total ?? 0))
      .catch(() => setCommentTotal(0));
  }, [video.id]);

  const handleSubmit = useCallback(async () => {
    if (!user) return;
    if (rating < 1) {
      toast.warning('请选择视频评分');
      return;
    }
    const trimmed = content.trim();
    if (trimmed.length < 15) {
      toast.warning('评论内容不少于 15 字');
      return;
    }
    setSubmitting(true);
    try {
      await submitVideoComment(video.id, { rating, content: trimmed });
      toast.success('评分发表成功');
      setRating(0);
      setContent('');
      setDialogOpen(false);
      const page = await getVideoComments(video.id, 1, 1);
      setCommentTotal(page.total ?? 0);
    } catch {
      toast.error('发表失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  }, [user, rating, content, video.id]);

  const openRating = () => {
    requireAuth(() => setDialogOpen(true));
  };

  return (
    <>
      <aside className="flex flex-col h-full min-h-[280px] rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 leading-snug line-clamp-3">
            {displayTitle}
          </h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 gap-3">
          <VideoStarDisplay score={video.score ?? 0} size="lg" />
          <p className="text-sm text-slate-500">
            （{commentTotal} 份评论）
          </p>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-white/60">
          <p className="text-xs text-slate-500 mb-3 truncate">
            发布者：
            <span className="text-slate-700 font-medium ml-1">
              {video.publisherName || video.teacherName || '淘课网'}
            </span>
          </p>
          <button
            type="button"
            onClick={openRating}
            className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold shadow-md shadow-primary/25 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 transition-all"
          >
            去评分
          </button>
        </div>
      </aside>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareQuote className="size-5 text-primary" />
              为课程评分
            </DialogTitle>
          </DialogHeader>

          {!user ? (
            <p className="text-sm text-slate-600">
              请先{' '}
              <Link href={loginHref} className="text-primary hover:underline">
                登录
              </Link>{' '}
              后再评分
            </p>
          ) : (
            <div className="space-y-4 pt-2">
              <StarPicker value={rating} onChange={setRating} />
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="分享您的学习感受（不少于 15 字）"
                rows={4}
                maxLength={2000}
                disabled={submitting}
                className="resize-none"
              />
              <Button
                type="button"
                className="w-full"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? '提交中…' : '提交评分'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
