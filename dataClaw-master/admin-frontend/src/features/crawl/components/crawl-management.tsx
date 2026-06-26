'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
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
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
import {
  useCancelCrawlJob,
  useImportCrawledCourse,
  useImportCrawledTrainer,
  useRejectCrawledCourse,
  useRejectCrawledTrainer,
  useTriggerCrawl
} from '../api/mutations';
import type {
  CrawlJob,
  CrawlSource,
  CrawledCourse,
  CrawledCourseDetail,
  CrawledTrainer,
  CrawledTrainerDetail,
  MediaAsset
} from '../api/types';

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

function dataTypeLabel(value: string) {
  return value === 'TRAINER' ? '专家' : value === 'COURSE' ? '课程' : value;
}

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

function normalizeMediaAssets(
  detail: Pick<CrawledTrainerDetail, 'rawJson'> | Pick<CrawledCourseDetail, 'servicesList' | 'rawJson'>
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

  const rawMedia = detail.rawJson && typeof detail.rawJson === 'object'
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

  const detail = detailQuery.data?.data;
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

  const detail = detailQuery.data?.data;
  const mediaAssets = detail ? normalizeMediaAssets(detail) : [];

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
              <DetailBlock label='价格' value={String(detail.price ?? 0)} />
              <DetailBlock label='天数' value={String(detail.durationDays ?? 0)} />
              <DetailBlock label='适合对象' value={detail.audience || detail.targetAudience} />
              <DetailBlock label='学习收益' value={detail.learningOutcomes} />
            </div>
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

function DetailBlock({ label, value, large = false }: { label: string; value?: string | null; large?: boolean }) {
  return (
    <div className={large ? 'space-y-2' : 'space-y-1'}>
      <div className='text-xs text-muted-foreground'>{label}</div>
      <div className={large ? 'rounded-md border p-3 text-sm leading-6 whitespace-pre-wrap' : 'text-sm'}>
        {value || '暂无'}
      </div>
    </div>
  );
}

export function CrawlSourcesPanel() {
  const { data: resp, isLoading } = useQuery(sourcesQueryOptions());
  const triggerMutation = useTriggerCrawl();
  const [maxItemsBySource, setMaxItemsBySource] = useState<Record<string, string>>({});

  const sources = resp?.data ?? [];

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
        onSuccess: () => toast.success('爬取任务已提交'),
        onError: () => toast.error('爬取任务提交失败')
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
      const jobs = query.state.data?.data.list ?? [];
      return jobs.some((job) => job.status === 1) ? 1000 : false;
    }
  });
  const cancelMutation = useCancelCrawlJob();

  const jobs = query.data?.data.list ?? [];

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
            {!query.isLoading && jobs.length === 0 && <EmptyRow colSpan={8} text='暂无爬取任务' />}
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
  const filters = useMemo(
    () => ({ page, size: pageSize, reviewStatus: '0' }),
    [page, pageSize]
  );
  const query = useQuery(crawledTrainersQueryOptions(filters));
  const importMutation = useImportCrawledTrainer();
  const rejectMutation = useRejectCrawledTrainer();
  const trainers = query.data?.data.list ?? [];
  const total = query.data?.data.total ?? 0;

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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>专家</TableHead>
            <TableHead>来源</TableHead>
            <TableHead>擅长领域</TableHead>
            <TableHead>去重</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>抓取时间</TableHead>
            <TableHead className='text-right'>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {query.isLoading && <LoadingRow colSpan={7} />}
          {!query.isLoading && trainers.length === 0 && <EmptyRow colSpan={7} text='暂无待审核专家' />}
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
              <TableCell className='max-w-[240px] truncate'>{trainer.expertiseTags || '-'}</TableCell>
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
              <TableCell className='space-x-2 text-right'>
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
    </ReviewTableShell>
  );
}

export function CrawledCoursesPanel() {
  const [detailId, setDetailId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const filters = useMemo(
    () => ({ page, size: pageSize, reviewStatus: '0' }),
    [page, pageSize]
  );
  const query = useQuery(crawledCoursesQueryOptions(filters));
  const importMutation = useImportCrawledCourse();
  const rejectMutation = useRejectCrawledCourse();
  const courses = query.data?.data.list ?? [];
  const total = query.data?.data.total ?? 0;

  const handleImport = (course: CrawledCourse) => {
    const trainerName = course.trainerNameRaw || '外部课程讲师';
    const confirmed = window.confirm(
      `系统会按讲师“${trainerName}”自动匹配正式专家；匹配不到会自动创建专家档案，再导入课程。是否继续？`
    );
    if (!confirmed) {
      return;
    }
    const categoryIdText = window.prompt('请输入一级分类 ID（可留空，默认 0）', '0');
    const subCategoryIdText = window.prompt('请输入二级分类 ID（可留空，默认 0）', '0');
    const forceImport =
      course.dedupStatus === 2 && window.confirm('该课程疑似重复，是否仍然强制导入？');
    if (course.dedupStatus === 2 && !forceImport) return;
    importMutation.mutate(
      {
        id: course.id,
        edits: {
          categoryId: Number(categoryIdText) || 0,
          subCategoryId: Number(subCategoryIdText) || 0,
          forceImport
        }
      },
      {
        onSuccess: (resp) => toast.success(`已导入课程 #${resp.data}`),
        onError: () => toast.error('导入失败')
      }
    );
  };

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

  return (
    <ReviewTableShell
      title='待审核课程'
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>课程</TableHead>
            <TableHead>来源</TableHead>
            <TableHead>分类/讲师</TableHead>
            <TableHead>价格</TableHead>
            <TableHead>去重</TableHead>
            <TableHead>状态</TableHead>
            <TableHead className='text-right'>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {query.isLoading && <LoadingRow colSpan={7} />}
          {!query.isLoading && courses.length === 0 && <EmptyRow colSpan={7} text='暂无待审核课程' />}
          {courses.map((course) => (
            <TableRow key={course.id}>
              <TableCell>
                <div className='flex items-center gap-3'>
                  {course.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.coverUrl}
                      alt={course.title || '课程封面'}
                      className='h-12 w-16 rounded-md border object-cover'
                    />
                  ) : (
                    <div className='flex h-12 w-16 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground'>
                      无图
                    </div>
                  )}
                  <div className='min-w-0'>
                    <div className='max-w-[320px] truncate font-medium'>{course.title || '暂无标题'}</div>
                    <div className='text-xs text-muted-foreground'>{course.type}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>{course.source}</div>
                <a
                  href={course.sourceUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='block max-w-[220px] truncate text-xs text-primary'
                >
                  原始页面
                </a>
              </TableCell>
              <TableCell>
                <div className='max-w-[220px] truncate'>{course.categoryNameRaw || '-'}</div>
                <div className='max-w-[220px] truncate text-xs text-muted-foreground'>
                  {course.trainerNameRaw || '-'}
                </div>
              </TableCell>
              <TableCell>{course.price ?? 0}</TableCell>
              <TableCell>
                <Badge variant={course.dedupStatus === 2 ? 'destructive' : 'outline'}>
                  {course.dedupStatusText}
                </Badge>
                {course.dedupReason && (
                  <div className='mt-1 max-w-[220px] truncate text-xs text-muted-foreground'>
                    {course.dedupReason}
                  </div>
                )}
              </TableCell>
              <TableCell>{course.reviewStatusText}</TableCell>
              <TableCell className='space-x-2 text-right'>
                <Button variant='outline' size='sm' onClick={() => setDetailId(course.id)}>
                  查看
                </Button>
                <Button
                  size='sm'
                  disabled={importMutation.isPending || rejectMutation.isPending}
                  onClick={() => handleImport(course)}
                >
                  导入
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={importMutation.isPending || rejectMutation.isPending}
                  onClick={() => handleReject(course)}
                >
                  驳回
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ReviewTableShell>
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
