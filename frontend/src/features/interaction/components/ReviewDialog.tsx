'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { submitReview } from '../api/service';
import type { SubmitReviewPayload } from '../api/types';
import { ReviewPhotoUploader } from './ReviewPhotoUploader';
import {
  validateForm,
  getFirstError,
  type FormValidationRules,
} from '@/lib/validation';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/** 培训主题候选项（专家维度评价时使用） */
export interface ReviewTopicOption {
  /** 主题来源类型：课程/录播课 */
  type: 'COURSE' | 'VIDEO';
  /** 课程或录播课 ID */
  id: number;
  /** 显示名称（课程标题或录播课标题） */
  title: string;
  /** 可选标签（公开课/内训课/录播课） */
  badge?: string;
}

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: 'COURSE' | 'TRAINER' | 'INSTITUTION';
  courseId?: number;
  trainerUserId?: number;
  institutionId?: number;
  /** 兼容旧用法：COURSE 时表示课程标题；TRAINER/INSTITUTION 时表示专家/机构名称 */
  prefillTitle?: string;
  /** 预填专家姓名（COURSE 评价时使用） */
  prefillExpertName?: string;
  /** 预填课程/培训主题（COURSE 评价时使用） */
  prefillCourseTitle?: string;
  /** 预填开课地点 */
  prefillTrainingLocation?: string;
  /** 预填开课时间（YYYY-MM-DD） */
  prefillTrainingDate?: string;
  /**
   * 培训主题候选列表 — 仅 scope=TRAINER 时使用。
   * <p>提供后，培训主题字段渲染为下拉选择；选项来自专家的课程 + 录播课。</p>
   */
  topicOptions?: ReviewTopicOption[];
  onSuccess?: () => void;
}

/** 文字评价快捷标签（点击追加到评价末尾） */
const QUICK_COMMENT_TAGS = ['内容详实', '气氛活跃', '干货满满'] as const;

/** 表单内部状态结构（用于校验） */
interface ReviewFormState extends Record<string, unknown> {
  expertName: string;
  topicValue: string;
  clientCompany: string;
  trainingLocation: string;
  trainingDate: string;
  ratingContent: number;
  ratingTeaching: number;
  ratingService: number;
  commentText: string;
  submitterName: string;
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
            className="p-0.5 transition-colors cursor-pointer hover:scale-110"
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

/** 必填星号标签 */
function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label>
      {children}
      <span className="text-red-500 ml-0.5">*</span>
    </Label>
  );
}

export default function ReviewDialog({
  open,
  onOpenChange,
  scope,
  courseId,
  trainerUserId,
  institutionId,
  prefillTitle,
  prefillExpertName,
  prefillCourseTitle,
  prefillTrainingLocation,
  prefillTrainingDate,
  topicOptions,
  onSuccess,
}: ReviewDialogProps) {
  const useTopicSelect = scope === 'TRAINER' && Array.isArray(topicOptions) && topicOptions.length > 0;

  const resolvedExpertName =
    prefillExpertName
    ?? (scope === 'TRAINER' || scope === 'INSTITUTION' ? prefillTitle : '')
    ?? '';
  const resolvedCourseTitle =
    prefillCourseTitle
    ?? (scope === 'COURSE' ? prefillTitle : '')
    ?? '';

  const [ratingContent, setRatingContent] = useState(0);
  const [ratingTeaching, setRatingTeaching] = useState(0);
  const [ratingService, setRatingService] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [expertName, setExpertName] = useState(resolvedExpertName);
  const [topicValue, setTopicValue] = useState<string>(
    scope === 'COURSE' ? resolvedCourseTitle : '',
  );
  const [clientCompany, setClientCompany] = useState('');
  const [trainingLocation, setTrainingLocation] = useState(prefillTrainingLocation ?? '');
  const [trainingDate, setTrainingDate] = useState(prefillTrainingDate ?? '');
  const [submitterName, setSubmitterName] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setExpertName(resolvedExpertName);
    setTopicValue(scope === 'COURSE' ? resolvedCourseTitle : '');
    setTrainingLocation(prefillTrainingLocation ?? '');
    setTrainingDate(prefillTrainingDate ?? '');
  }, [
    open,
    scope,
    resolvedExpertName,
    resolvedCourseTitle,
    prefillTrainingLocation,
    prefillTrainingDate,
  ]);

  /** 选项 key 形如 "COURSE-12" / "VIDEO-3"，方便回查所选项 */
  const optionKey = useCallback(
    (opt: ReviewTopicOption) => `${opt.type}-${opt.id}`,
    [],
  );

  const selectedTopic = useMemo<ReviewTopicOption | undefined>(() => {
    if (!useTopicSelect) return undefined;
    return topicOptions!.find((o) => optionKey(o) === topicValue);
  }, [useTopicSelect, topicOptions, topicValue, optionKey]);

  const resetForm = useCallback(() => {
    setRatingContent(0);
    setRatingTeaching(0);
    setRatingService(0);
    setCommentText('');
    setExpertName(resolvedExpertName);
    setTopicValue(scope === 'COURSE' ? resolvedCourseTitle : '');
    setClientCompany('');
    setTrainingLocation(prefillTrainingLocation ?? '');
    setTrainingDate(prefillTrainingDate ?? '');
    setSubmitterName('');
    setPhotoUrls([]);
    setError('');
  }, [
    resolvedExpertName,
    resolvedCourseTitle,
    scope,
    prefillTrainingLocation,
    prefillTrainingDate,
  ]);

  /** 追加快捷标签到文字评价（避免重复追加同一标签） */
  const handleAppendTag = (tag: string) => {
    setCommentText((prev) => {
      if (prev.includes(tag)) return prev;
      const sep = prev.trim().length === 0 ? '' : prev.endsWith('，') || prev.endsWith(',') ? '' : '，';
      return `${prev}${sep}${tag}`;
    });
  };

  /** 表单校验规则 — 全部字段必填 */
  const buildRules = (): FormValidationRules<ReviewFormState> => ({
    expertName: { required: true, requiredMessage: '请输入专家姓名' },
    topicValue: {
      required: true,
      requiredMessage: useTopicSelect ? '请选择培训主题' : '请输入培训主题',
    },
    clientCompany: { required: true, requiredMessage: '请输入甲方企业' },
    trainingLocation: { required: true, requiredMessage: '请输入开课地点' },
    trainingDate: { required: true, requiredMessage: '请选择开课时间' },
    ratingContent: {
      required: true,
      validator: (v) => ((v as number) > 0 ? undefined : '请为「授课内容」打分'),
    },
    ratingTeaching: {
      required: true,
      validator: (v) => ((v as number) > 0 ? undefined : '请为「授课水平」打分'),
    },
    ratingService: {
      required: true,
      validator: (v) => ((v as number) > 0 ? undefined : '请为「服务态度」打分'),
    },
    commentText: {
      required: true,
      requiredMessage: '请输入文字评价',
      validator: (v) => {
        const txt = (v as string) ?? '';
        if (txt.trim().length < 20) return '文字评价不能少于 20 字';
        return undefined;
      },
    },
    submitterName: { required: true, requiredMessage: '请输入您的姓名' },
  });

  const handleSubmit = async () => {
    const formData: ReviewFormState = {
      expertName,
      topicValue,
      clientCompany,
      trainingLocation,
      trainingDate,
      ratingContent,
      ratingTeaching,
      ratingService,
      commentText,
      submitterName,
    };
    const result = validateForm(formData, buildRules());
    if (!result.valid) {
      setError(getFirstError(result.errors) ?? '请完善评价信息');
      return;
    }

    // 解析培训主题对应的标题与课程 ID（如选中的是录播课，则不携带 courseId）
    const finalCourseTitle = useTopicSelect ? (selectedTopic?.title ?? '') : topicValue;
    const finalCourseId =
      scope === 'COURSE'
        ? courseId
        : useTopicSelect && selectedTopic?.type === 'COURSE'
          ? selectedTopic.id
          : undefined;

    const payload: SubmitReviewPayload = {
      reviewScope: scope,
      courseId: finalCourseId,
      trainerUserId: scope === 'TRAINER' ? trainerUserId : undefined,
      institutionId: scope === 'INSTITUTION' ? institutionId : undefined,
      expertName,
      courseTitle: finalCourseTitle,
      clientCompany,
      trainingLocation,
      trainingDate: trainingDate || undefined,
      ratingContent,
      ratingTeaching,
      ratingService,
      commentText,
      submitterName,
      photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
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
            {scope === 'COURSE' && '课程评价'}
            {scope === 'TRAINER' && '专家评价'}
            {scope === 'INSTITUTION' && '机构评价'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <RequiredLabel>专家姓名</RequiredLabel>
            <Input
              value={expertName}
              onChange={(e) => setExpertName(e.target.value)}
              placeholder="请输入专家姓名"
            />
          </div>

          <div className="grid gap-1.5">
            <RequiredLabel>培训主题</RequiredLabel>
            {useTopicSelect ? (
              <select
                value={topicValue}
                onChange={(e) => setTopicValue(e.target.value)}
                className="h-9 px-3 rounded-md border border-input bg-transparent text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer"
              >
                <option value="">请选择培训主题（来源专家课程 / 录播课）</option>
                {topicOptions!.map((opt) => (
                  <option key={optionKey(opt)} value={optionKey(opt)}>
                    {opt.badge ? `[${opt.badge}] ` : ''}
                    {opt.title}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                value={topicValue}
                onChange={(e) => setTopicValue(e.target.value)}
                placeholder="请输入培训主题/课程名称"
              />
            )}
          </div>

          <div className="grid gap-1.5">
            <RequiredLabel>甲方企业</RequiredLabel>
            <Input
              value={clientCompany}
              onChange={(e) => setClientCompany(e.target.value)}
              placeholder="请输入甲方企业名称"
            />
          </div>

          <div className="grid gap-1.5">
            <RequiredLabel>开课地点</RequiredLabel>
            <Input
              value={trainingLocation}
              onChange={(e) => setTrainingLocation(e.target.value)}
              placeholder="请输入开课地点"
            />
          </div>

          <div className="grid gap-1.5">
            <RequiredLabel>开课时间</RequiredLabel>
            <DateInput
              max={todayStr()}
              value={trainingDate}
              onChange={(e) => setTrainingDate(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <RequiredLabel>综合评分</RequiredLabel>
            <StarRating label="授课内容" value={ratingContent} onChange={setRatingContent} />
            <StarRating label="授课水平" value={ratingTeaching} onChange={setRatingTeaching} />
            <StarRating label="服务态度" value={ratingService} onChange={setRatingService} />
          </div>

          <div className="grid gap-1.5">
            <RequiredLabel>文字评价（不少于 20 字）</RequiredLabel>
            {/* 快捷追加标签：点击直接拼到 textarea 末尾，避免用户重复输入常见好评词 */}
            <div className="flex flex-wrap gap-2">
              {QUICK_COMMENT_TAGS.map((tag) => {
                const active = commentText.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAppendTag(tag)}
                    className={`px-3 py-1 text-xs rounded-full border cursor-pointer transition-colors ${
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/40 hover:text-primary'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="请输入您的评价内容..."
              rows={4}
            />
            <span className="text-xs text-muted-foreground text-right">
              {commentText.length}/20 字
            </span>
          </div>

          <div className="grid gap-1.5">
            <Label>培训现场照片</Label>
            <ReviewPhotoUploader value={photoUrls} onChange={setPhotoUrls} disabled={submitting} />
          </div>

          <div className="grid gap-1.5">
            <RequiredLabel>您的姓名</RequiredLabel>
            <Input
              value={submitterName}
              onChange={(e) => setSubmitterName(e.target.value)}
              placeholder="请输入您的姓名"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
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
