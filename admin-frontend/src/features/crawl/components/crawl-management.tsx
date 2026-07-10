'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  crawlJobsQueryOptions,
  crawledCourseDetailQueryOptions,
  crawledCoursesQueryOptions,
  crawledTrainerDetailQueryOptions,
  crawledTrainersQueryOptions,
  sourcesQueryOptions
} from '../api/queries';
import { categoryTreeQueryOptions } from '@/features/categories/api/queries';
import {
  useCancelCrawlJob,
  useImportCrawledCourse,
  useImportCrawledTrainer,
  useRejectCrawledCourse,
  useRejectCrawledTrainer,
  useRestoreCrawledCourse,
  useTriggerCrawl,
  useUpdateCrawledCourse
} from '../api/mutations';
import type { CategoryNode } from '@/features/categories/api/types';
import type {
  CrawlJob,
  CrawlSource,
  CrawledCourse,
  CrawledCourseDetail,
  CrawledTrainer,
  CrawledTrainerDetail,
  MediaAsset,
  CrawledCourseEditPayload
} from '../api/types';

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

function dataTypeLabel(value: string) {
  return value === 'TRAINER' ? '专家' : value === 'COURSE' ? '课程' : value;
}

function courseTypeLabel(value?: string | null) {
  if (value === 'OPEN_ONLINE') return '\u7ebf\u4e0a\u516c\u5f00\u8bfe';
  if (value === 'OPEN_OFFLINE') return '\u7ebf\u4e0b\u516c\u5f00\u8bfe';
  if (value === 'INTERNAL') return '\u5185\u8bad\u8bfe';
  return value || '\u5f85\u786e\u8ba4';
}

function priceStatusLabel(value?: string | null) {
  if (value === 'NUMERIC') return '数字价格';
  if (value === 'FREE') return '免费';
  if (value === 'NEGOTIABLE') return '待商议';
  if (value === 'MISSING') return '未抓到价格';
  if (value === 'INVALID') return '价格异常';
  return value || '未标注';
}

function priceStatusVariant(
  value?: string | null
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (value === 'NEGOTIABLE' || value === 'MISSING') return 'secondary';
  if (value === 'INVALID') return 'destructive';
  if (value === 'FREE' || value === 'NUMERIC') return 'outline';
  return 'outline';
}

type PriceDisplay = {
  label: string;
  subText?: string;
  note?: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
};

function formatPrice(value?: number | null) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '待确认价格';
  return amount === 0 ? '0 元' : `¥${amount.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`;
}

function coursePriceDisplay(course: {
  price?: number | null;
  priceRaw?: string | null;
  priceParseStatus?: string | null;
}): PriceDisplay {
  const status = course.priceParseStatus;
  const priceRaw = course.priceRaw?.trim();
  const price = Number(course.price ?? 0);

  if (status === 'NEGOTIABLE') {
    return {
      label: '待商议',
      subText: priceRaw || '源站未给出明确数字',
      note: '当前 0 仅作占位，不代表免费。',
      variant: 'secondary'
    };
  }
  if (status === 'MISSING') {
    return {
      label: '未抓到价格',
      subText: priceRaw || '需审核补充',
      note: '当前 0 不是免费含义。',
      variant: 'secondary'
    };
  }
  if (status === 'INVALID') {
    return {
      label: '价格异常',
      subText: priceRaw || '请根据源站人工修正',
      note: '解析失败，导入前请确认。',
      variant: 'destructive'
    };
  }
  if (status === 'FREE') {
    return {
      label: '免费',
      subText: priceRaw || undefined,
      variant: 'outline'
    };
  }
  if (status === 'NUMERIC') {
    return {
      label: formatPrice(price),
      subText: priceRaw || '数字价格',
      variant: 'outline'
    };
  }
  if (price > 0) {
    return {
      label: formatPrice(price),
      subText: priceRaw || undefined,
      variant: 'outline'
    };
  }
  return {
    label: '待确认价格',
    subText: priceRaw || '未提供源站原文',
    note: '当前 0 不是明确免费。',
    variant: 'secondary'
  };
}

function contentTypeLabel(value?: string | null) {
  if (value === 'COURSE') return '课程';
  if (value === 'LIVE') return '直播课';
  if (value === 'RECORDED_VIDEO') return '录播/视频';
  if (value === 'DOCUMENT') return '文档资料';
  if (value === 'AUDIO') return '音频';
  return value || '未识别';
}

function dedupTargetLabel(value?: string | null) {
  if (value === 'COURSE') return '正式课程';
  if (value === 'CRAWLED_COURSE') return '待审核采集课程';
  return '重复目标';
}

const courseReviewTabs = [
  { value: '0', label: '待审核', title: '待审核课程', emptyText: '暂无待审核课程' },
  { value: '3', label: '已入库', title: '已入库课程', emptyText: '暂无已入库课程' },
  { value: '2', label: '已驳回', title: '已驳回课程', emptyText: '暂无已驳回课程' },
  { value: 'all', label: '全部', title: '全部采集课程', emptyText: '暂无采集课程' }
] as const;

type CourseReviewTabValue = (typeof courseReviewTabs)[number]['value'];

function courseReviewTab(value: CourseReviewTabValue) {
  return courseReviewTabs.find((tab) => tab.value === value) ?? courseReviewTabs[0];
}

function flattenCategories(nodes: CategoryNode[] = []): CategoryNode[] {
  return nodes.flatMap((node) => [node, ...flattenCategories(node.children ?? [])]);
}

function toText(value: unknown) {
  return value === null || value === undefined ? '' : String(value);
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

const stickyActionHeadClass =
  'sticky top-0 right-0 z-40 w-[220px] bg-card text-right shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.35)]';

const stickyActionCellClass =
  'sticky right-0 z-20 w-[220px] space-x-2 whitespace-nowrap bg-card text-right shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.35)]';

const stickyReviewHeadClass = 'sticky top-0 z-30 bg-card shadow-sm';

function statusBadgeVariant(status?: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 2 || status === 3) return 'secondary';
  if (status === 1) return 'default';
  return 'outline';
}

function progressPercent(job: CrawlJob) {
  if (!job.totalCount) return 0;
  return Math.min(100, Math.round(((job.processedCount || 0) / job.totalCount) * 100));
}

function progressIndicatorClass(job: CrawlJob) {
  if (job.status === 1) return 'bg-blue-500';
  if (job.status === 2) return 'bg-emerald-500';
  if (job.status === 3 || job.errorCount) return 'bg-destructive';
  if (job.status === 4) return 'bg-slate-400';
  return 'bg-amber-500';
}

function progressTrackClass(job: CrawlJob) {
  if (job.status === 1) return 'bg-blue-100';
  if (job.status === 2) return 'bg-emerald-100';
  if (job.status === 3 || job.errorCount) return 'bg-destructive/15';
  if (job.status === 4) return 'bg-slate-100';
  return 'bg-amber-100';
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className='h-24 text-center text-muted-foreground'>
        {text}
      </TableCell>
    </TableRow>
  );
}

function LoadingRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className='h-24 text-center text-muted-foreground'>
        <Icons.spinner className='mr-2 inline h-4 w-4 animate-spin' />
        加载中...
      </TableCell>
    </TableRow>
  );
}

function ReviewTableViewport({ children }: { children: ReactNode }) {
  return (
    <div className='max-h-[calc(100dvh-260px)] overflow-auto rounded-md border'>{children}</div>
  );
}

function normalizeMediaAssets(
  detail:
    | Pick<CrawledTrainerDetail, 'rawJson'>
    | Pick<CrawledCourseDetail, 'servicesList' | 'rawJson'>
) {
  const result: MediaAsset[] = [];
  const seen = new Set<string>();

  const push = (asset: MediaAsset | null | undefined) => {
    if (!asset?.url || seen.has(asset.url)) return;
    seen.add(asset.url);
    result.push(asset);
  };

  if ('servicesList' in detail) {
    (detail.servicesList ?? []).forEach(push);
  }

  const rawMedia =
    detail.rawJson && typeof detail.rawJson === 'object'
      ? (detail.rawJson.media_assets as MediaAsset[] | undefined)
      : undefined;
  rawMedia?.forEach(push);

  return result;
}

function JsonPreview({ data }: { data: unknown }) {
  if (!data) {
    return <div className='text-sm text-muted-foreground'>暂无原始 JSON</div>;
  }
  return (
    <pre className='max-h-72 overflow-auto rounded-md bg-muted p-3 text-xs leading-5 whitespace-pre-wrap break-all'>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function MediaGallery({ assets }: { assets: MediaAsset[] }) {
  if (assets.length === 0) {
    return <div className='text-sm text-muted-foreground'>暂无图片资源</div>;
  }

  return (
    <div className='grid gap-3 sm:grid-cols-2'>
      {assets.map((asset, index) => (
        <div key={`${asset.url}-${index}`} className='space-y-2 rounded-md border p-3'>
          <div className='flex items-center justify-between gap-2 text-xs text-muted-foreground'>
            <span>{asset.label || asset.type || '图片资源'}</span>
            {asset.url ? (
              <a
                href={asset.url}
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-1 text-primary'
              >
                打开
                <Icons.externalLink className='h-3.5 w-3.5' />
              </a>
            ) : null}
          </div>
          {asset.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset.url}
              alt={asset.label || asset.type || '图片资源'}
              className='aspect-video w-full rounded-md border object-cover'
            />
          ) : null}
          <div className='break-all text-xs text-muted-foreground'>{asset.url || '-'}</div>
        </div>
      ))}
    </div>
  );
}

function TrainerDetailDialog({
  trainerId,
  open,
  onOpenChange
}: {
  trainerId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const detailId = trainerId ?? 0;
  const detailQuery = useQuery({
    ...crawledTrainerDetailQueryOptions(detailId),
    enabled: open && trainerId !== null
  });

  const detail = detailQuery.data;
  const mediaAssets = detail ? normalizeMediaAssets(detail) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-auto sm:max-w-4xl'>
        <DialogHeader>
          <DialogTitle>{detail?.name || '专家详情'}</DialogTitle>
          <DialogDescription>{detail?.sourceUrl || '查看审核前采集到的专家信息'}</DialogDescription>
        </DialogHeader>
        {detailQuery.isLoading ? (
          <div className='py-10 text-center text-muted-foreground'>
            <Icons.spinner className='mr-2 inline h-4 w-4 animate-spin' />
            加载中...
          </div>
        ) : detail ? (
          <div className='space-y-6'>
            <MediaGallery assets={mediaAssets} />
            <div className='grid gap-4 md:grid-cols-2'>
              <DetailBlock label='头衔' value={detail.title} />
              <DetailBlock label='擅长领域' value={detail.expertiseTags || detail.goodAt} />
              <DetailBlock label='一句话介绍' value={detail.oneLineIntro} />
              <DetailBlock label='部分客户' value={detail.partialClients} />
            </div>
            <DetailBlock label='简介' value={detail.bio || detail.intro} large />
            <JsonPreview data={detail.rawJson} />
          </div>
        ) : (
          <div className='py-10 text-center text-muted-foreground'>暂无详情</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CourseDetailDialog({
  courseId,
  open,
  onOpenChange
}: {
  courseId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const detailId = courseId ?? 0;
  const detailQuery = useQuery({
    ...crawledCourseDetailQueryOptions(detailId),
    enabled: open && courseId !== null
  });

  const detail = detailQuery.data;
  const mediaAssets = detail ? normalizeMediaAssets(detail) : [];
  const priceDisplay = detail ? coursePriceDisplay(detail) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-auto sm:max-w-4xl'>
        <DialogHeader>
          <DialogTitle>{detail?.title || '课程详情'}</DialogTitle>
          <DialogDescription>{detail?.sourceUrl || '查看审核前采集到的课程信息'}</DialogDescription>
        </DialogHeader>
        {detailQuery.isLoading ? (
          <div className='py-10 text-center text-muted-foreground'>
            <Icons.spinner className='mr-2 inline h-4 w-4 animate-spin' />
            加载中...
          </div>
        ) : detail ? (
          <div className='space-y-6'>
            <MediaGallery assets={mediaAssets} />
            <div className='grid gap-4 md:grid-cols-2'>
              <DetailBlock label='分类' value={detail.categoryNameRaw} />
              <DetailBlock label='讲师' value={detail.trainerNameRaw} />
              <DetailBlock
                label='价格'
                value={[
                  priceDisplay?.label,
                  priceDisplay?.subText ? `原文：${priceDisplay.subText}` : '',
                  priceDisplay?.note
                ]
                  .filter(Boolean)
                  .join('；')}
              />
              <DetailBlock label='价格状态' value={priceStatusLabel(detail.priceParseStatus)} />
              <DetailBlock label='内容形态' value={contentTypeLabel(detail.contentType)} />
              <DetailBlock label='天数' value={String(detail.durationDays ?? 0)} />
              <DetailBlock label='审核状态' value={detail.reviewStatusText || '待审核'} />
              <DetailBlock label='处理时间' value={formatDate(detail.reviewedAt)} />
              <DetailBlock
                label='正式课程'
                value={detail.importedCourseId ? `#${detail.importedCourseId}` : '暂无'}
              />
              <DetailBlock label='驳回原因' value={detail.reviewRejectReason} />
              <DetailBlock label='适合对象' value={detail.audience || detail.targetAudience} />
              <DetailBlock label='学习收益' value={detail.learningOutcomes} />
            </div>
            <DiagnosticsList diagnostics={detail.diagnostics} />
            <DetailBlock label='简介' value={detail.intro || detail.summary} large />
            <DetailBlock label='大纲' value={detail.syllabus} large />
            <JsonPreview data={detail.rawJson} />
          </div>
        ) : (
          <div className='py-10 text-center text-muted-foreground'>暂无详情</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailBlock({
  label,
  value,
  large = false
}: {
  label: string;
  value?: string | null;
  large?: boolean;
}) {
  return (
    <div className={large ? 'space-y-2' : 'space-y-1'}>
      <div className='text-xs text-muted-foreground'>{label}</div>
      <div
        className={
          large ? 'rounded-md border p-3 text-sm leading-6 whitespace-pre-wrap' : 'text-sm'
        }
      >
        {value || '暂无'}
      </div>
    </div>
  );
}

function CourseReviewDialog({
  course,
  open,
  onOpenChange
}: {
  course: CrawledCourse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const detailId = course?.id ?? 0;
  const detailQuery = useQuery({
    ...crawledCourseDetailQueryOptions(detailId),
    enabled: open && course !== null
  });
  const categoryQuery = useQuery(categoryTreeQueryOptions('COURSE_CATEGORY'));
  const updateMutation = useUpdateCrawledCourse();
  const importMutation = useImportCrawledCourse();
  const detail = detailQuery.data;
  const categories = useMemo(() => categoryQuery.data?.data ?? [], [categoryQuery.data?.data]);
  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);
  const [form, setForm] = useState<CrawledCourseEditPayload>({});
  const [plansText, setPlansText] = useState('[]');
  const [plansError, setPlansError] = useState<string | null>(null);

  useEffect(() => {
    if (!detail || !open) return;
    setForm({
      title: detail.title ?? '',
      type: detail.type || 'OPEN_OFFLINE',
      categoryId: detail.categoryId || 0,
      subCategoryId: detail.subCategoryId || 0,
      categoryNameRaw: detail.categoryNameRaw ?? '',
      coverUrl: detail.coverUrl ?? '',
      trainerNameRaw: detail.trainerNameRaw ?? '',
      price: detail.price ?? 0,
      originalPrice: detail.originalPrice ?? 0,
      durationDays: detail.durationDays ?? 0,
      totalHours: detail.totalHours ?? 0,
      summary: detail.summary ?? '',
      intro: detail.intro ?? '',
      syllabus: detail.syllabus ?? '',
      audience: detail.audience ?? '',
      targetAudience: detail.targetAudience ?? '',
      learningOutcomes: detail.learningOutcomes ?? '',
      highlights: detail.highlights ?? '',
      keywords: detail.keywords ?? ''
    });
    setPlansText(JSON.stringify(detail.plansList ?? [], null, 2));
    setPlansError(null);
  }, [detail, open]);

  const setValue = <K extends keyof CrawledCourseEditPayload>(
    key: K,
    value: CrawledCourseEditPayload[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const parsePlans = (): Record<string, unknown>[] | null => {
    try {
      const parsed = JSON.parse(plansText || '[]') as unknown;
      if (!Array.isArray(parsed)) {
        setPlansError('排期必须是 JSON 数组');
        return null;
      }
      setPlansError(null);
      return parsed as Record<string, unknown>[];
    } catch {
      setPlansError('排期 JSON 格式不正确');
      return null;
    }
  };

  const readPlans = (): Record<string, unknown>[] => {
    try {
      const parsed = JSON.parse(plansText || '[]') as unknown;
      return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
    } catch {
      return [];
    }
  };

  const writePlans = (plans: Record<string, unknown>[]) => {
    setPlansText(JSON.stringify(plans, null, 2));
    setPlansError(null);
  };

  const updatePlan = (index: number, key: string, value: string | number) => {
    const plans = readPlans();
    const next = [...plans];
    next[index] = { ...next[index], [key]: value };
    writePlans(next);
  };

  const addPlan = () => {
    writePlans([
      ...readPlans(),
      {
        startDate: new Date().toISOString().slice(0, 10),
        provinceId: 0,
        cityId: 0,
        districtId: 0,
        city: '',
        address: '',
        onlineUrl: ''
      }
    ]);
  };

  const removePlan = (index: number) => {
    writePlans(readPlans().filter((_, itemIndex) => itemIndex !== index));
  };

  const payload = (): CrawledCourseEditPayload | null => {
    const plansJson = parsePlans();
    if (!plansJson) return null;
    return {
      ...form,
      categoryId: Number(form.categoryId) || 0,
      subCategoryId: Number(form.subCategoryId) || 0,
      durationDays: Number(form.durationDays) || 0,
      totalHours: Number(form.totalHours) || 0,
      price: Number(form.price) || 0,
      originalPrice: Number(form.originalPrice) || 0,
      plansJson
    };
  };

  const selectedCategory = flatCategories.find((item) => item.id === Number(form.categoryId));
  const subCategories = selectedCategory?.children ?? [];
  const canImport = Boolean(form.title && form.type && Number(form.categoryId) > 0);
  const planDrafts = readPlans();
  const planDate = (plan: Record<string, unknown>) =>
    toText(plan.startDate || plan.start_time || plan.startTime || plan.date);
  const offlinePlanLocation = (plan: Record<string, unknown>) =>
    toText(plan.address || plan.location || plan.city);
  const onlinePlanUrl = (plan: Record<string, unknown>) =>
    toText(plan.onlineUrl || plan.online_url || plan.url);
  const priceDisplay = detail ? coursePriceDisplay(detail) : null;
  const priceNeedsReview =
    detail?.priceParseStatus === 'NEGOTIABLE' || detail?.priceParseStatus === 'MISSING';
  const nonCourseContent = ['RECORDED_VIDEO', 'DOCUMENT', 'AUDIO'].includes(
    detail?.contentType || ''
  );
  const missingHints = [
    !form.title ? '标题必填' : '',
    !Number(form.categoryId) ? '平台分类待选择' : '',
    form.type === 'OPEN_OFFLINE' && planDrafts.length === 0 ? '线下公开课需要至少一条开课计划' : '',
    form.type === 'OPEN_OFFLINE' &&
    planDrafts.some((plan) => !planDate(plan) || !offlinePlanLocation(plan))
      ? '线下排期需要开课日期和地址'
      : '',
    form.type === 'OPEN_ONLINE' && planDrafts.length === 0 ? '线上公开课需要至少一条开课计划' : '',
    form.type === 'OPEN_ONLINE' &&
    planDrafts.some((plan) => !planDate(plan) || !onlinePlanUrl(plan))
      ? '线上排期需要开课日期和开课网址'
      : '',
    !form.audience && !form.targetAudience ? '适用对象待补充' : '',
    !form.learningOutcomes && !form.highlights ? '学习收益待补充' : '',
    priceNeedsReview ? '价格需要人工确认' : '',
    nonCourseContent ? `内容形态为${contentTypeLabel(detail?.contentType)}，不能导入 courses` : ''
  ].filter(Boolean);

  const handleSave = () => {
    if (!course) return;
    const body = payload();
    if (!body) return;
    updateMutation.mutate(
      { id: course.id, edits: body },
      {
        onSuccess: () => toast.success('\u5df2\u4fdd\u5b58\u5ba1\u6838\u4fee\u6539'),
        onError: (error) => toast.error(errorMessage(error, '\u4fdd\u5b58\u5931\u8d25'))
      }
    );
  };

  const handleImport = () => {
    if (!course) return;
    if (!canImport) {
      toast.error('\u8bf7\u5148\u586b\u5199\u6807\u9898\u5e76\u9009\u62e9\u5e73\u53f0\u5206\u7c7b');
      return;
    }
    if (nonCourseContent) {
      toast.error('当前内容形态不能导入 courses');
      return;
    }
    if (
      form.type === 'OPEN_OFFLINE' &&
      (planDrafts.length === 0 ||
        planDrafts.some((plan) => !planDate(plan) || !offlinePlanLocation(plan)))
    ) {
      toast.error('线下公开课导入前需要填写开课日期和地址；省市会根据地址自动解析');
      return;
    }
    if (
      form.type === 'OPEN_ONLINE' &&
      (planDrafts.length === 0 ||
        planDrafts.some((plan) => !planDate(plan) || !onlinePlanUrl(plan)))
    ) {
      toast.error('线上公开课导入前需要填写至少一条开课计划、开课日期和线上地址');
      return;
    }
    const body = payload();
    if (!body) return;
    const dedupStatus = detail?.dedupStatus ?? course.dedupStatus;
    const dedupReason = detail?.dedupReason || course.dedupReason;
    const dedupTarget = detail?.dedupTargetId
      ? `${dedupTargetLabel(detail.dedupTargetType)} #${detail.dedupTargetId}`
      : '';
    const forceImport =
      dedupStatus === 2 &&
      window.confirm(
        ['该课程疑似重复，是否确认不是重复并强制导入？', dedupTarget, dedupReason]
          .filter(Boolean)
          .join('\n')
      );
    if (dedupStatus === 2 && !forceImport) return;
    importMutation.mutate(
      { id: course.id, edits: { ...body, forceImport } },
      {
        onSuccess: (resp) => {
          toast.success(`\u5df2\u5bfc\u5165\u8bfe\u7a0b #${resp.data}`);
          onOpenChange(false);
        },
        onError: (error) => toast.error(errorMessage(error, '\u5bfc\u5165\u5931\u8d25'))
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-auto sm:max-w-4xl'>
        <DialogHeader>
          <DialogTitle>{'\u5ba1\u6838\u8bfe\u7a0b'}</DialogTitle>
          <DialogDescription>
            {course?.sourceUrl ||
              '\u8865\u5168\u6293\u53d6\u8bfe\u7a0b\u4fe1\u606f\u540e\u5bfc\u5165\u6b63\u5f0f\u8bfe\u7a0b'}
          </DialogDescription>
        </DialogHeader>
        {detailQuery.isLoading ? (
          <div className='py-10 text-center text-muted-foreground'>
            <Icons.spinner className='mr-2 inline h-4 w-4 animate-spin' />
            {'\u52a0\u8f7d\u4e2d...'}
          </div>
        ) : (
          <div className='space-y-5'>
            {detail && (
              <div className='rounded-md border bg-muted/40 p-3 text-sm'>
                <div className='flex flex-wrap items-center gap-2'>
                  <Badge
                    variant={priceDisplay?.variant ?? priceStatusVariant(detail.priceParseStatus)}
                  >
                    {priceDisplay?.label ?? priceStatusLabel(detail.priceParseStatus)}
                  </Badge>
                  <span className='text-muted-foreground'>
                    {'价格原文：'}
                    {priceDisplay?.subText || detail.priceRaw || '未抓到'}
                  </span>
                </div>
                {(priceNeedsReview || priceDisplay?.note) && (
                  <div className='mt-2 text-xs text-muted-foreground'>
                    {priceDisplay?.note ||
                      '该价格不是明确免费，导入前请人工确认价格；保留 0 时不会自动标记为免费课。'}
                  </div>
                )}
                {nonCourseContent && (
                  <div className='mt-2 text-xs text-destructive'>
                    当前识别为{contentTypeLabel(detail?.contentType)}，不能直接导入正式课程表。
                  </div>
                )}
                {detail.dedupStatus === 2 && (
                  <div className='mt-3 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs'>
                    <div className='font-medium text-destructive'>
                      {detail.dedupStatusText}
                      {detail.dedupScore != null ? ` · ${detail.dedupScore}分` : ''}
                    </div>
                    <div className='mt-1 text-muted-foreground'>
                      {detail.dedupTargetId
                        ? `${dedupTargetLabel(detail.dedupTargetType)} #${detail.dedupTargetId}`
                        : '未记录重复目标'}
                      {detail.dedupMatchType ? ` · ${detail.dedupMatchType}` : ''}
                    </div>
                    {detail.dedupReason && <div className='mt-1'>{detail.dedupReason}</div>}
                  </div>
                )}
                <DiagnosticsList diagnostics={detail.diagnostics} compact />
                {missingHints.length > 0 && (
                  <div className='mt-3 flex flex-wrap gap-2'>
                    {missingHints.map((hint) => (
                      <Badge key={hint} variant='outline'>
                        {hint}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className='grid gap-4 md:grid-cols-3'>
              <div className='space-y-2'>
                <Label>{'\u8bfe\u7a0b\u7c7b\u578b'}</Label>
                <Select
                  value={form.type || 'OPEN_OFFLINE'}
                  onValueChange={(value) => setValue('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='OPEN_ONLINE'>{'\u7ebf\u4e0a\u516c\u5f00\u8bfe'}</SelectItem>
                    <SelectItem value='OPEN_OFFLINE'>{'\u7ebf\u4e0b\u516c\u5f00\u8bfe'}</SelectItem>
                    <SelectItem value='INTERNAL'>{'\u5185\u8bad\u8bfe'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>{'\u5e73\u53f0\u5206\u7c7b'}</Label>
                <Select
                  value={String(form.categoryId || 0)}
                  onValueChange={(value) => {
                    setValue('categoryId', toNumber(value));
                    setValue('subCategoryId', 0);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='\u8bf7\u9009\u62e9\u5e73\u53f0\u5206\u7c7b' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='0'>{'\u5f85\u9009\u62e9'}</SelectItem>
                    {categories.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>{'\u4e8c\u7ea7\u5206\u7c7b'}</Label>
                <Select
                  value={String(form.subCategoryId || 0)}
                  onValueChange={(value) => setValue('subCategoryId', toNumber(value))}
                  disabled={subCategories.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='\u53ef\u9009' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='0'>{'\u4e0d\u9009\u62e9'}</SelectItem>
                    {subCategories.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <LabeledInput
                label='课程标题'
                value={toText(form.title)}
                onChange={(value) => setValue('title', value)}
              />
              <LabeledInput
                label='来源分类'
                value={toText(form.categoryNameRaw)}
                onChange={(value) => setValue('categoryNameRaw', value)}
              />
              <LabeledInput
                label='封面地址'
                value={toText(form.coverUrl)}
                onChange={(value) => setValue('coverUrl', value)}
              />
              <LabeledInput
                label='讲师原始名'
                value={toText(form.trainerNameRaw)}
                onChange={(value) => setValue('trainerNameRaw', value)}
              />
              <div className='space-y-2'>
                <Label>价格</Label>
                <Input
                  type='number'
                  value={toText(form.price)}
                  onChange={(event) => setValue('price', toNumber(event.target.value))}
                />
                {priceDisplay && (
                  <div className='rounded-md border bg-muted/40 px-2 py-1.5 text-xs'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <Badge variant={priceDisplay.variant}>{priceDisplay.label}</Badge>
                      <span className='text-muted-foreground'>{priceDisplay.subText}</span>
                    </div>
                    {priceDisplay.note && (
                      <div className='mt-1 text-muted-foreground'>{priceDisplay.note}</div>
                    )}
                  </div>
                )}
              </div>
              <LabeledInput
                label='原价'
                type='number'
                value={toText(form.originalPrice)}
                onChange={(value) => setValue('originalPrice', toNumber(value))}
              />
              <LabeledInput
                label='课程天数'
                type='number'
                value={toText(form.durationDays)}
                onChange={(value) => setValue('durationDays', toNumber(value))}
              />
              <LabeledInput
                label='总课时'
                type='number'
                value={toText(form.totalHours)}
                onChange={(value) => setValue('totalHours', toNumber(value))}
              />
              <LabeledInput
                label='关键词'
                value={toText(form.keywords)}
                onChange={(value) => setValue('keywords', value)}
              />
            </div>
            <LabeledTextarea
              label='课程简介'
              value={toText(form.intro)}
              onChange={(value) => setValue('intro', value)}
            />
            <LabeledTextarea
              label='摘要'
              value={toText(form.summary)}
              onChange={(value) => setValue('summary', value)}
            />
            <LabeledTextarea
              label='适用对象'
              value={toText(form.audience)}
              onChange={(value) => setValue('audience', value)}
            />
            <LabeledTextarea
              label='目标人群'
              value={toText(form.targetAudience)}
              onChange={(value) => setValue('targetAudience', value)}
            />
            <LabeledTextarea
              label='学习收益'
              value={toText(form.learningOutcomes)}
              onChange={(value) => setValue('learningOutcomes', value)}
            />
            <LabeledTextarea
              label='课程亮点'
              value={toText(form.highlights)}
              onChange={(value) => setValue('highlights', value)}
            />
            <LabeledTextarea
              label='课程大纲'
              value={toText(form.syllabus)}
              onChange={(value) => setValue('syllabus', value)}
              minHeight='min-h-36'
            />
            <div className='space-y-3 rounded-md border p-3'>
              <div className='flex items-center justify-between gap-2'>
                <Label>开课计划</Label>
                <Button type='button' variant='outline' size='sm' onClick={addPlan}>
                  新增排期
                </Button>
              </div>
              {planDrafts.length === 0 ? (
                <div className='text-sm text-muted-foreground'>
                  暂无排期。公开课导入正式课程前需要至少一条排期。
                </div>
              ) : (
                <div className='space-y-3'>
                  {planDrafts.map((plan, index) => (
                    <div
                      key={index}
                      className='grid gap-3 rounded-md border bg-muted/30 p-3 md:grid-cols-6'
                    >
                      <LabeledInput
                        label='开课日期'
                        type='date'
                        value={toText(
                          plan.startDate || plan.start_time || plan.startTime || plan.date
                        )}
                        onChange={(value) => updatePlan(index, 'startDate', value)}
                      />
                      <LabeledInput
                        label='省份ID（可选）'
                        type='number'
                        value={toText(plan.provinceId || plan.province_id || 0)}
                        onChange={(value) => updatePlan(index, 'provinceId', toNumber(value))}
                      />
                      <LabeledInput
                        label='城市ID（可选）'
                        type='number'
                        value={toText(plan.cityId || plan.city_id || 0)}
                        onChange={(value) => updatePlan(index, 'cityId', toNumber(value))}
                      />
                      <LabeledInput
                        label='城市/地点'
                        value={toText(plan.city || plan.location)}
                        onChange={(value) => updatePlan(index, 'city', value)}
                      />
                      <LabeledInput
                        label='具体地址'
                        value={toText(plan.address)}
                        onChange={(value) => updatePlan(index, 'address', value)}
                      />
                      <LabeledInput
                        label='线上地址'
                        value={toText(plan.onlineUrl || plan.online_url)}
                        onChange={(value) => updatePlan(index, 'onlineUrl', value)}
                      />
                      <div className='md:col-span-6'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => removePlan(index)}
                        >
                          删除该排期
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className='text-xs text-muted-foreground'>
                线下公开课填写开课日期和地址即可，系统会尽量自动解析省市；省份ID、城市ID仅在自动解析失败时用于人工修正。线上公开课需要填写开课日期和线上地址。
              </div>
            </div>
            <div className='space-y-2'>
              <Label>排期 JSON</Label>
              <textarea
                className='min-h-32 w-full rounded-md border bg-background px-3 py-2 font-mono text-xs'
                value={plansText}
                onChange={(event) => setPlansText(event.target.value)}
              />
              <div
                className={
                  plansError ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'
                }
              >
                {plansError || '公开课排期使用 JSON 数组保存；内训课可保持为空数组。'}
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            variant='outline'
            onClick={handleSave}
            disabled={!course || updateMutation.isPending}
          >
            {'\u4fdd\u5b58\u4fee\u6539'}
          </Button>
          <Button
            onClick={handleImport}
            disabled={!course || importMutation.isPending || !canImport || nonCourseContent}
          >
            {'\u5bfc\u5165\u6b63\u5f0f\u8bfe\u7a0b'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = 'text'
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className='space-y-2'>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function LabeledTextarea({
  label,
  value,
  onChange,
  minHeight = 'min-h-24'
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minHeight?: string;
}) {
  return (
    <div className='space-y-2'>
      <Label>{label}</Label>
      <textarea
        className={`${minHeight} w-full rounded-md border bg-background px-3 py-2 text-sm`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function CrawlSourcesPanel() {
  const { data: sources = [], isLoading } = useQuery(sourcesQueryOptions());
  const triggerMutation = useTriggerCrawl();
  const [maxItemsBySource, setMaxItemsBySource] = useState<Record<string, string>>({});

  const handleTrigger = (source: CrawlSource) => {
    const inputKey = `${source.code}-${source.dataType}`;
    const maxItems = Number(maxItemsBySource[inputKey]);
    triggerMutation.mutate(
      {
        source: source.code,
        dataType: source.dataType,
        maxItems: Number.isFinite(maxItems) && maxItems > 0 ? maxItems : undefined
      },
      {
        onSuccess: () => toast.success('采集任务已提交'),
        onError: () => toast.error('采集任务提交失败')
      }
    );
  };

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle>可用数据源</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>数据源</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>地址</TableHead>
                <TableHead className='w-[120px]'>数量</TableHead>
                <TableHead className='w-[120px]'>状态</TableHead>
                <TableHead className='w-[140px] text-right'>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <LoadingRow colSpan={6} />}
              {!isLoading && sources.length === 0 && <EmptyRow colSpan={6} text='暂无数据源' />}
              {sources.map((source) => (
                <TableRow key={`${source.code}-${source.dataType}`}>
                  <TableCell>
                    <div className='font-medium'>{source.name}</div>
                    <div className='text-xs text-muted-foreground'>{source.code}</div>
                  </TableCell>
                  <TableCell>{dataTypeLabel(source.dataType)}</TableCell>
                  <TableCell>
                    <a
                      href={source.url}
                      target='_blank'
                      rel='noreferrer'
                      className='inline-flex max-w-[280px] items-center gap-1 truncate text-sm text-primary'
                    >
                      <span className='truncate'>{source.url}</span>
                      <Icons.externalLink className='h-3.5 w-3.5 shrink-0' />
                    </a>
                  </TableCell>
                  <TableCell>
                    <Input
                      type='number'
                      min={1}
                      placeholder='全部'
                      value={maxItemsBySource[`${source.code}-${source.dataType}`] ?? ''}
                      onChange={(event) =>
                        setMaxItemsBySource((prev) => ({
                          ...prev,
                          [`${source.code}-${source.dataType}`]: event.target.value
                        }))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant='outline'>{source.status}</Badge>
                  </TableCell>
                  <TableCell className='text-right'>
                    <Button
                      size='sm'
                      onClick={() => handleTrigger(source)}
                      disabled={triggerMutation.isPending}
                    >
                      {triggerMutation.isPending ? (
                        <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                      ) : (
                        <Icons.send className='mr-2 h-4 w-4' />
                      )}
                      开始
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function CrawlJobsPanel() {
  const filters = useMemo(() => ({ page: 1, size: 20 }), []);
  const query = useQuery({
    ...crawlJobsQueryOptions(filters),
    refetchInterval: (query) => {
      const jobs = query.state.data?.list ?? [];
      return jobs.some((job) => job.status === 1) ? 1000 : false;
    }
  });
  const cancelMutation = useCancelCrawlJob();

  const jobs = query.data?.list ?? [];

  const handleCancel = (job: CrawlJob) => {
    cancelMutation.mutate(job.id, {
      onSuccess: () => toast.success('任务已取消'),
      onError: () => toast.error('取消任务失败')
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between gap-3'>
          <CardTitle>最近任务</CardTitle>
          <Button variant='outline' size='sm' onClick={() => void query.refetch()}>
            <Icons.spinner className='mr-2 h-4 w-4' />
            刷新
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>数据源</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>进度</TableHead>
              <TableHead>Python 任务</TableHead>
              <TableHead>开始时间</TableHead>
              <TableHead className='text-right'>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading && <LoadingRow colSpan={8} />}
            {!query.isLoading && jobs.length === 0 && <EmptyRow colSpan={8} text='暂无任务进程' />}
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>{job.id}</TableCell>
                <TableCell>{job.source}</TableCell>
                <TableCell>{dataTypeLabel(job.dataType)}</TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant(job.status)}>{job.statusLabel}</Badge>
                  {job.errorMessage && (
                    <div className='mt-1 max-w-[220px] truncate text-xs text-destructive'>
                      {job.errorMessage}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className='min-w-[160px] space-y-1'>
                    <div className='flex items-center justify-between text-xs'>
                      <span>
                        {job.processedCount || 0}/{job.totalCount || '发现中'}
                      </span>
                      <span className='text-muted-foreground'>{progressPercent(job)}%</span>
                    </div>
                    <Progress
                      value={progressPercent(job)}
                      className={`h-1.5 ${progressTrackClass(job)}`}
                      indicatorClassName={progressIndicatorClass(job)}
                    />
                    <div className='text-muted-foreground text-xs'>
                      成功 {job.successCount || 0}
                      {job.errorCount ? ` / 错误 ${job.errorCount}` : ''}
                    </div>
                    {job.progressMessage && (
                      <div className='max-w-[220px] truncate text-xs text-muted-foreground'>
                        {job.progressMessage}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className='font-mono text-xs'>{job.crawlerJobId ?? '-'}</TableCell>
                <TableCell>{formatDate(job.startedAt || job.createdAt)}</TableCell>
                <TableCell className='text-right'>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={job.status !== 1 || cancelMutation.isPending}
                    onClick={() => handleCancel(job)}
                  >
                    取消
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function CrawledTrainersPanel() {
  const [detailId, setDetailId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const filters = useMemo(() => ({ page, size: pageSize, reviewStatus: '0' }), [page, pageSize]);
  const query = useQuery(crawledTrainersQueryOptions(filters));
  const importMutation = useImportCrawledTrainer();
  const rejectMutation = useRejectCrawledTrainer();
  const trainers = query.data?.list ?? [];
  const total = query.data?.total ?? 0;

  const handleImport = (trainer: CrawledTrainer) => {
    const forceImport =
      trainer.dedupStatus === 2 && window.confirm('该专家疑似重复，是否仍然强制导入？');
    if (trainer.dedupStatus === 2 && !forceImport) return;
    importMutation.mutate(
      {
        id: trainer.id,
        edits: { forceImport }
      },
      {
        onSuccess: (resp) => toast.success(`已导入专家 #${resp.data}`),
        onError: () => toast.error('导入失败')
      }
    );
  };

  const handleReject = (trainer: CrawledTrainer) => {
    const reason = window.prompt('请输入驳回原因', '数据不符合入库要求');
    if (!reason) return;
    rejectMutation.mutate(
      { id: trainer.id, reason },
      {
        onSuccess: () => toast.success('已驳回'),
        onError: () => toast.error('驳回失败')
      }
    );
  };

  return (
    <ReviewTableShell
      title='待审核专家'
      onRefresh={() => void query.refetch()}
      pagination={
        <ReviewPagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(nextSize) => {
            setPageSize(nextSize);
            setPage(1);
          }}
        />
      }
    >
      <TrainerDetailDialog
        trainerId={detailId}
        open={detailId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
      />
      <ReviewTableViewport>
        <Table className='min-w-[1180px] table-fixed'>
          <TableHeader>
            <TableRow>
              <TableHead className={`${stickyReviewHeadClass} w-[210px]`}>专家</TableHead>
              <TableHead className={`${stickyReviewHeadClass} w-[170px]`}>来源</TableHead>
              <TableHead className={`${stickyReviewHeadClass} w-[220px]`}>擅长领域</TableHead>
              <TableHead className={`${stickyReviewHeadClass} w-[140px]`}>去重</TableHead>
              <TableHead className={`${stickyReviewHeadClass} w-[90px]`}>状态</TableHead>
              <TableHead className={`${stickyReviewHeadClass} w-[130px]`}>抓取时间</TableHead>
              <TableHead className={stickyActionHeadClass}>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading && <LoadingRow colSpan={7} />}
            {!query.isLoading && trainers.length === 0 && (
              <EmptyRow colSpan={7} text='暂无待审核专家' />
            )}
            {trainers.map((trainer) => (
              <TableRow key={trainer.id}>
                <TableCell>
                  <div className='flex items-center gap-3'>
                    {trainer.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={trainer.avatar}
                        alt={trainer.name || '专家头像'}
                        className='h-12 w-12 rounded-md border object-cover'
                      />
                    ) : (
                      <div className='flex h-12 w-12 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground'>
                        无图
                      </div>
                    )}
                    <div className='min-w-0'>
                      <div className='font-medium'>{trainer.name || '暂无姓名'}</div>
                      <div className='max-w-[260px] truncate text-xs text-muted-foreground'>
                        {trainer.title || '-'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>{trainer.source}</div>
                  <a
                    href={trainer.sourceUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='block max-w-[220px] truncate text-xs text-primary'
                  >
                    原始页面
                  </a>
                </TableCell>
                <TableCell className='max-w-[240px] truncate'>
                  {trainer.expertiseTags || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={trainer.dedupStatus === 2 ? 'destructive' : 'outline'}>
                    {trainer.dedupStatusText}
                  </Badge>
                  {trainer.dedupReason && (
                    <div className='mt-1 max-w-[220px] truncate text-xs text-muted-foreground'>
                      {trainer.dedupReason}
                    </div>
                  )}
                </TableCell>
                <TableCell>{trainer.reviewStatusText}</TableCell>
                <TableCell>{formatDate(trainer.createdAt)}</TableCell>
                <TableCell className={stickyActionCellClass}>
                  <Button variant='outline' size='sm' onClick={() => setDetailId(trainer.id)}>
                    查看
                  </Button>
                  <Button
                    size='sm'
                    disabled={importMutation.isPending || rejectMutation.isPending}
                    onClick={() => handleImport(trainer)}
                  >
                    导入
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={importMutation.isPending || rejectMutation.isPending}
                    onClick={() => handleReject(trainer)}
                  >
                    驳回
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ReviewTableViewport>
    </ReviewTableShell>
  );
}

export function CrawledCoursesPanel() {
  const [detailId, setDetailId] = useState<number | null>(null);
  const [reviewCourse, setReviewCourse] = useState<CrawledCourse | null>(null);
  const [activeReviewStatus, setActiveReviewStatus] = useState<CourseReviewTabValue>('0');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const activeTab = courseReviewTab(activeReviewStatus);
  const filters = useMemo(
    () => ({
      page,
      size: pageSize,
      reviewStatus: activeReviewStatus === 'all' ? undefined : activeReviewStatus
    }),
    [activeReviewStatus, page, pageSize]
  );
  const query = useQuery(crawledCoursesQueryOptions(filters));
  const rejectMutation = useRejectCrawledCourse();
  const restoreMutation = useRestoreCrawledCourse();
  const courses = query.data?.list ?? [];
  const total = query.data?.total ?? 0;

  const handleImport = (course: CrawledCourse) => setReviewCourse(course);

  const handleReject = (course: CrawledCourse) => {
    const reason = window.prompt('请输入驳回原因', '数据不符合入库要求');
    if (!reason) return;
    rejectMutation.mutate(
      { id: course.id, reason },
      {
        onSuccess: () => toast.success('已驳回'),
        onError: () => toast.error('驳回失败')
      }
    );
  };

  const handleRestore = (course: CrawledCourse) => {
    const confirmed = window.confirm('确定将该课程恢复为待审核吗？恢复后可重新编辑并导入。');
    if (!confirmed) return;
    restoreMutation.mutate(course.id, {
      onSuccess: () => toast.success('已恢复为待审核'),
      onError: (error) => toast.error(errorMessage(error, '恢复失败'))
    });
  };

  const handleTabChange = (value: string) => {
    setActiveReviewStatus(value as CourseReviewTabValue);
    setPage(1);
  };

  return (
    <ReviewTableShell
      title={activeTab.title}
      onRefresh={() => void query.refetch()}
      pagination={
        <ReviewPagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(nextSize) => {
            setPageSize(nextSize);
            setPage(1);
          }}
        />
      }
    >
      <CourseDetailDialog
        courseId={detailId}
        open={detailId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
      />
      <CourseReviewDialog
        course={reviewCourse}
        open={reviewCourse !== null}
        onOpenChange={(open) => {
          if (!open) setReviewCourse(null);
        }}
      />
      <Tabs value={activeReviewStatus} onValueChange={handleTabChange}>
        <TabsList>
          {courseReviewTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <ReviewTableViewport>
        <Table className='min-w-[1240px] table-fixed'>
          <TableHeader>
            <TableRow>
              <TableHead className={`${stickyReviewHeadClass} w-[200px]`}>课程</TableHead>
              <TableHead className={`${stickyReviewHeadClass} w-[160px]`}>来源</TableHead>
              <TableHead className={`${stickyReviewHeadClass} w-[170px]`}>分类/讲师</TableHead>
              <TableHead className={`${stickyReviewHeadClass} w-[130px]`}>价格</TableHead>
              <TableHead className={`${stickyReviewHeadClass} w-[130px]`}>去重</TableHead>
              <TableHead className={`${stickyReviewHeadClass} w-[160px]`}>状态/处理</TableHead>
              <TableHead className={stickyActionHeadClass}>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading && <LoadingRow colSpan={7} />}
            {!query.isLoading && courses.length === 0 && (
              <EmptyRow colSpan={7} text={activeTab.emptyText} />
            )}
            {courses.map((course) => {
              const priceDisplay = coursePriceDisplay(course);
              return (
                <TableRow key={course.id}>
                  <TableCell className='w-[200px] max-w-[200px]'>
                    <div className='flex items-center gap-2'>
                      {course.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={course.coverUrl}
                          alt={course.title || '课程封面'}
                          className='h-10 w-12 rounded-md border object-cover'
                        />
                      ) : (
                        <div className='flex h-10 w-12 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground'>
                          无图
                        </div>
                      )}
                      <div className='min-w-0'>
                        <div className='max-w-[130px] truncate font-medium'>
                          {course.title || '暂无标题'}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          {course.typeLabel || courseTypeLabel(course.type)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{course.source}</div>
                    <a
                      href={course.sourceUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='block max-w-[140px] truncate text-xs text-primary'
                    >
                      原始页面
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className='max-w-[150px] truncate text-xs'>
                      {'\u6765\u6e90\u5206\u7c7b\uff1a'}
                      {course.categoryNameRaw || '\u5f85\u8865\u5145'}
                    </div>
                    <div className='max-w-[150px] truncate text-xs'>
                      {'\u5e73\u53f0\u5206\u7c7b\uff1a'}
                      {course.categoryName || '\u5f85\u9009\u62e9'}
                      {course.subCategoryName ? ` / ${course.subCategoryName}` : ''}
                    </div>
                    <div className='max-w-[150px] truncate text-xs text-muted-foreground'>
                      {'\u8bb2\u5e08\uff1a'}
                      {course.trainerNameRaw || '\u5f85\u8865\u5145'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex max-w-[110px] flex-col gap-1'>
                      <Badge variant={priceDisplay.variant} className='w-fit max-w-full truncate'>
                        {priceDisplay.label}
                      </Badge>
                      {priceDisplay.subText && (
                        <span className='truncate text-xs text-muted-foreground'>
                          {priceDisplay.subText}
                        </span>
                      )}
                      {course.contentType && course.contentType !== 'COURSE' && (
                        <span className='truncate text-xs text-muted-foreground'>
                          {contentTypeLabel(course.contentType)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className='w-[130px] max-w-[130px]'>
                    <Badge
                      variant={course.dedupStatus === 2 ? 'destructive' : 'outline'}
                      className='max-w-full truncate'
                    >
                      {course.dedupStatusText}
                    </Badge>
                    {course.dedupStatus === 2 && (
                      <div className='mt-1 max-w-[110px] truncate text-xs text-muted-foreground'>
                        {course.dedupTargetId
                          ? `${dedupTargetLabel(course.dedupTargetType)} #${course.dedupTargetId}`
                          : '重复目标待确认'}
                        {course.dedupScore != null ? ` · ${course.dedupScore}分` : ''}
                      </div>
                    )}
                    {course.dedupReason && (
                      <div className='mt-1 max-w-[110px] truncate text-xs text-muted-foreground'>
                        {course.dedupReason}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <CourseReviewStatusInfo course={course} />
                  </TableCell>
                  <TableCell className={stickyActionCellClass}>
                    <CourseReviewActions
                      course={course}
                      rejectPending={rejectMutation.isPending}
                      restorePending={restoreMutation.isPending}
                      onView={() => setDetailId(course.id)}
                      onImport={() => handleImport(course)}
                      onReject={() => handleReject(course)}
                      onRestore={() => handleRestore(course)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ReviewTableViewport>
    </ReviewTableShell>
  );
}

function CourseReviewStatusInfo({ course }: { course: CrawledCourse }) {
  if (course.reviewStatus === 3) {
    return (
      <div className='max-w-[140px] space-y-1 text-xs'>
        <Badge variant='default'>{course.reviewStatusText}</Badge>
        <div className='truncate text-muted-foreground'>{formatDate(course.reviewedAt)}</div>
        <div className='truncate text-muted-foreground'>
          {course.importedCourseId ? `正式课程 #${course.importedCourseId}` : '正式课程 ID 缺失'}
        </div>
      </div>
    );
  }
  if (course.reviewStatus === 2) {
    return (
      <div className='max-w-[140px] space-y-1 text-xs'>
        <Badge variant='secondary'>{course.reviewStatusText}</Badge>
        <div className='truncate text-muted-foreground'>{formatDate(course.reviewedAt)}</div>
        <div className='truncate text-muted-foreground'>
          {course.reviewRejectReason || '未填写驳回原因'}
        </div>
      </div>
    );
  }
  if (course.reviewStatus === 1) {
    return (
      <div className='max-w-[140px] space-y-1 text-xs'>
        <Badge variant='outline'>{course.reviewStatusText}</Badge>
        <div className='truncate text-muted-foreground'>{formatDate(course.reviewedAt)}</div>
      </div>
    );
  }
  return (
    <div className='max-w-[140px] space-y-1 text-xs'>
      <Badge variant='outline'>{course.reviewStatusText || '待审核'}</Badge>
      <div className='truncate text-muted-foreground'>抓取：{formatDate(course.createdAt)}</div>
    </div>
  );
}

function CourseReviewActions({
  course,
  rejectPending,
  restorePending,
  onView,
  onImport,
  onReject,
  onRestore
}: {
  course: CrawledCourse;
  rejectPending: boolean;
  restorePending: boolean;
  onView: () => void;
  onImport: () => void;
  onReject: () => void;
  onRestore: () => void;
}) {
  if (course.reviewStatus === 3) {
    return (
      <>
        <Button variant='outline' size='sm' onClick={onView}>
          查看
        </Button>
        {course.importedCourseId ? (
          <Button asChild size='sm'>
            <Link href={`/dashboard/courses/${course.importedCourseId}`}>正式课程</Link>
          </Button>
        ) : (
          <Button size='sm' disabled>
            正式课程
          </Button>
        )}
      </>
    );
  }
  if (course.reviewStatus === 2) {
    return (
      <>
        <Button variant='outline' size='sm' onClick={onView}>
          查看
        </Button>
        <Button size='sm' disabled={restorePending} onClick={onRestore}>
          恢复待审核
        </Button>
      </>
    );
  }
  if (course.reviewStatus === 1) {
    return (
      <Button variant='outline' size='sm' onClick={onView}>
        查看
      </Button>
    );
  }
  return (
    <>
      <Button variant='outline' size='sm' onClick={onView}>
        查看
      </Button>
      <Button size='sm' disabled={rejectPending} onClick={onImport}>
        {'\u5ba1\u6838\u5bfc\u5165'}
      </Button>
      <Button variant='outline' size='sm' disabled={rejectPending} onClick={onReject}>
        驳回
      </Button>
    </>
  );
}

function DiagnosticsList({
  diagnostics,
  compact = false
}: {
  diagnostics?: CrawledCourseDetail['diagnostics'];
  compact?: boolean;
}) {
  if (!diagnostics || diagnostics.length === 0) return null;
  const visible = diagnostics.slice(0, compact ? 3 : 8);
  return (
    <div className={compact ? 'mt-3 space-y-1' : 'space-y-2'}>
      {!compact && <div className='text-xs text-muted-foreground'>字段质量提示</div>}
      <div className='flex flex-wrap gap-2'>
        {visible.map((item, index) => (
          <Badge
            key={`${item.field ?? 'field'}-${item.reason ?? 'reason'}-${index}`}
            variant='secondary'
          >
            {[item.field, item.reason, item.raw].filter(Boolean).join(' / ')}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function ReviewTableShell({
  title,
  onRefresh,
  pagination,
  children
}: {
  title: string;
  onRefresh: () => void;
  pagination?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between gap-3'>
          <CardTitle>{title}</CardTitle>
          <Button variant='outline' size='sm' onClick={onRefresh}>
            <Icons.spinner className='mr-2 h-4 w-4' />
            刷新
          </Button>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {children}
        {pagination}
      </CardContent>
    </Card>
  );
}

function ReviewPagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className='flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between'>
      <div>
        共 {total} 条，当前 {start}-{end} 条
      </div>
      <div className='flex items-center gap-2'>
        <span>每页</span>
        <select
          className='h-8 rounded-md border bg-background px-2 text-foreground'
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {[10, 20, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <Button
          variant='outline'
          size='sm'
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          上一页
        </Button>
        <span className='min-w-16 text-center text-foreground'>
          {page} / {pageCount}
        </span>
        <Button
          variant='outline'
          size='sm'
          disabled={page >= pageCount}
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        >
          下一页
        </Button>
      </div>
    </div>
  );
}
