'use client';

import { useCallback, useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { usePathname } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { ROUTES } from '@/config/routes';
import { Button, buttonVariants } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { VideoComment } from '../../api/types';
import { getVideoComments, submitVideoComment } from '../../api/service';
import { cn } from '@/lib/utils';
import { ApiException } from '@/lib/http/client';

interface VideoCommentsSectionProps {
  videoId: number;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-0.5 cursor-pointer hover:scale-110 transition-transform"
          aria-label={`${star} 星`}
        >
          <Star
            className={`size-5 ${
              star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
            }`}
          />
        </button>
      ))}
      {value > 0 && <span className="ml-2 text-sm text-slate-500">{value} 分</span>}
    </div>
  );
}

function CommentList({ comments }: { comments: VideoComment[] }) {
  return (
    <ul className="space-y-4 mb-6">
      {comments.map((comment) => (
        <li key={comment.id} className="border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-slate-800">{comment.userName}</span>
            <span className="text-xs text-slate-400 shrink-0">
              {comment.createdAt
                ? new Date(comment.createdAt).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-2">
            {Array.from({ length: comment.rating }).map((_, i) => (
              <Star key={i} className="size-3.5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>
        </li>
      ))}
    </ul>
  );
}

function CommentForm({
  videoId,
}: {
  videoId: number;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loginHref = `${ROUTES.LOGIN}?redirect=${encodeURIComponent(pathname)}`;

  const handleSubmit = async () => {
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
      await submitVideoComment(videoId, { rating, content: trimmed });
      toast.success('评论已提交，审核通过后将展示');
      setRating(0);
      setContent('');
    } catch (err) {
      if (!(err instanceof ApiException)) {
        toast.error('发表评论失败，请稍后重试');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
      <h4 className="text-sm font-medium text-slate-800 mb-3">发表评论</h4>

      {!user ? (
        <p className="text-sm text-slate-500 mb-4">
          请先{' '}
          <Link href={loginHref} className="text-primary hover:underline">
            登录
          </Link>{' '}
          后再发表评论
        </p>
      ) : null}

      <div className="space-y-4">
        <div>
          <p className="text-sm text-slate-600 mb-2">视频评分</p>
          <StarPicker value={rating} onChange={setRating} />
        </div>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="请输入评论内容（不少于 15 字）"
          rows={5}
          maxLength={2000}
          disabled={!user || submitting}
          className="bg-white resize-none"
        />
        <div className="flex justify-end">
          {!user ? (
            <Link href={loginHref} className={cn(buttonVariants())}>
              登录后发表
            </Link>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '提交中…' : '发表'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function VideoCommentsSection({ videoId }: VideoCommentsSectionProps) {
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const page = await getVideoComments(videoId, 1, 20);
      setComments(page.list ?? []);
      setTotal(page.total ?? 0);
    } catch {
      setComments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  return (
    <div>
      <p className="text-sm text-slate-400 text-right mb-4">共 {total} 条评论</p>

      {loading ? (
        <p className="text-center py-6 text-slate-400 text-sm mb-4">加载评论中…</p>
      ) : comments.length > 0 ? (
        <CommentList comments={comments} />
      ) : null}

      <CommentForm videoId={videoId} />
    </div>
  );
}
