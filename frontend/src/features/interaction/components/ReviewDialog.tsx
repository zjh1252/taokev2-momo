'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { submitReview } from '../api/service';
import type { SubmitReviewPayload } from '../api/types';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: 'COURSE' | 'TRAINER';
  courseId?: number;
  trainerUserId?: number;
  /** 预填充的课程标题或专家姓名 */
  prefillTitle?: string;
  onSuccess?: () => void;
}

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-sm text-muted-foreground shrink-0">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-0.5 transition-colors"
          >
            <Star
              className={`h-5 w-5 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground/30'
              }`}
            />
          </button>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{value > 0 ? `${value}分` : ''}</span>
    </div>
  );
}

export default function ReviewDialog({
  open,
  onOpenChange,
  scope,
  courseId,
  trainerUserId,
  prefillTitle,
  onSuccess,
}: ReviewDialogProps) {
  const [ratingContent, setRatingContent] = useState(0);
  const [ratingTeaching, setRatingTeaching] = useState(0);
  const [ratingService, setRatingService] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [expertName, setExpertName] = useState(prefillTitle ?? '');
  const [courseTitle, setCourseTitle] = useState(scope === 'COURSE' ? (prefillTitle ?? '') : '');
  const [clientCompany, setClientCompany] = useState('');
  const [trainingLocation, setTrainingLocation] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const resetForm = useCallback(() => {
    setRatingContent(0);
    setRatingTeaching(0);
    setRatingService(0);
    setCommentText('');
    setExpertName(prefillTitle ?? '');
    setCourseTitle(scope === 'COURSE' ? (prefillTitle ?? '') : '');
    setClientCompany('');
    setTrainingLocation('');
    setSubmitterName('');
    setError('');
  }, [prefillTitle, scope]);

  const handleSubmit = async () => {
    if (ratingContent === 0 || ratingTeaching === 0 || ratingService === 0) {
      setError('请完成三项评分');
      return;
    }
    if (commentText.length < 20) {
      setError('文字评价不能少于20字');
      return;
    }

    const payload: SubmitReviewPayload = {
      reviewScope: scope,
      courseId: scope === 'COURSE' ? courseId : undefined,
      trainerUserId: scope === 'TRAINER' ? trainerUserId : undefined,
      expertName,
      courseTitle,
      clientCompany,
      trainingLocation,
      ratingContent,
      ratingTeaching,
      ratingService,
      commentText,
      submitterName,
    };

    setSubmitting(true);
    setError('');
    try {
      await submitReview(payload);
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {scope === 'COURSE' ? '课程评价' : '专家评价'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* 专家姓名 */}
          <div className="grid gap-1.5">
            <Label>专家姓名</Label>
            <Input
              value={expertName}
              onChange={(e) => setExpertName(e.target.value)}
              placeholder="请输入专家姓名"
            />
          </div>

          {/* 课程标题 */}
          <div className="grid gap-1.5">
            <Label>培训主题</Label>
            <Input
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="请输入培训主题/课程名称"
            />
          </div>

          {/* 甲方企业 */}
          <div className="grid gap-1.5">
            <Label>甲方企业</Label>
            <Input
              value={clientCompany}
              onChange={(e) => setClientCompany(e.target.value)}
              placeholder="请输入甲方企业名称"
            />
          </div>

          {/* 培训地点 */}
          <div className="grid gap-1.5">
            <Label>培训地点</Label>
            <Input
              value={trainingLocation}
              onChange={(e) => setTrainingLocation(e.target.value)}
              placeholder="请输入培训地点"
            />
          </div>

          {/* 三维评分 */}
          <div className="grid gap-2">
            <Label>综合评分</Label>
            <StarRating label="授课内容" value={ratingContent} onChange={setRatingContent} />
            <StarRating label="授课水平" value={ratingTeaching} onChange={setRatingTeaching} />
            <StarRating label="服务态度" value={ratingService} onChange={setRatingService} />
          </div>

          {/* 文字评价 */}
          <div className="grid gap-1.5">
            <Label>文字评价（不少于20字）</Label>
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="请输入您的评价内容..."
              rows={4}
            />
            <span className="text-xs text-muted-foreground text-right">
              {commentText.length}/20字
            </span>
          </div>

          {/* 评价者姓名 */}
          <div className="grid gap-1.5">
            <Label>您的姓名</Label>
            <Input
              value={submitterName}
              onChange={(e) => setSubmitterName(e.target.value)}
              placeholder="请输入您的姓名"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '提交中...' : '提交评价'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
