'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { resolveAssetUrl } from '@/lib/resolve-asset-url';
import {
  VIDEO_STATUS_MAP,
  type AdminVideoDetail,
  type VideoChapter,
} from '../api/types';

/**
 * 录播课详情卡片
 *
 * @author Fangxinxin
 * @date 2026-04-28 19:55
 */
function statusVariant(
  status: number,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 2:
      return 'default';
    case 1:
      return 'secondary';
    case 3:
    case 4:
      return 'destructive';
    default:
      return 'outline';
  }
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${m > 0 ? `${m}m` : ''}`;
  if (m > 0) return `${m}m${s > 0 ? `${s}s` : ''}`;
  return `${s}s`;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN');
}

export function VideoDetailView({ detail }: { detail: AdminVideoDetail }) {
  const cover = resolveAssetUrl(detail.coverUrl);
  return (
    <div className='space-y-6'>
      <div className='rounded-lg border p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold'>{detail.title}</h3>
          <div className='flex items-center gap-2'>
            {detail.isFeatured === 1 && <Badge>主打</Badge>}
            {detail.isFree === 1 && <Badge variant='outline'>免费</Badge>}
            <Badge variant={statusVariant(detail.status)}>
              {VIDEO_STATUS_MAP[detail.status] ?? detail.statusLabel ?? '未知'}
            </Badge>
          </div>
        </div>

        <div className='flex gap-6'>
          {cover && (
            <div className='relative w-48 h-28 shrink-0 rounded-md overflow-hidden bg-muted'>
              <Image
                src={cover}
                alt={detail.title}
                fill
                className='object-cover'
                sizes='192px'
                unoptimized
              />
            </div>
          )}
          <div className='grid grid-cols-2 gap-4 text-sm flex-1'>
            <div>
              <span className='text-muted-foreground'>录播课 ID：</span>
              <span>{detail.id}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>类型：</span>
              <span>{detail.videoTypeLabel}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>分类：</span>
              <span>
                {detail.categoryName ?? '-'}
                {detail.subCategoryName ? ` / ${detail.subCategoryName}` : ''}
              </span>
            </div>
            <div>
              <span className='text-muted-foreground'>价格：</span>
              <span className='font-medium'>
                {detail.isFree === 1
                  ? '免费'
                  : detail.price != null
                  ? `¥${Number(detail.price).toLocaleString()}`
                  : '-'}
              </span>
            </div>
            {detail.originalPrice != null && (
              <div>
                <span className='text-muted-foreground'>原价：</span>
                <span>¥{Number(detail.originalPrice).toLocaleString()}</span>
              </div>
            )}
            <div>
              <span className='text-muted-foreground'>总时长：</span>
              <span>{formatDuration(detail.duration)}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>总集数：</span>
              <span>{detail.totalEpisodes ?? 0}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>讲师：</span>
              <span>
                {detail.teacherName || detail.trainerName || '-'}
              </span>
            </div>
            <div>
              <span className='text-muted-foreground'>发布者：</span>
              <span>
                {detail.publisherName ?? '-'}
                {detail.publisherType ? ` (${detail.publisherType})` : ''}
              </span>
            </div>
            <div>
              <span className='text-muted-foreground'>浏览量：</span>
              <span>{detail.viewCount?.toLocaleString() ?? 0}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>学习人数：</span>
              <span>{detail.studentCount?.toLocaleString() ?? 0}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>评分：</span>
              <span>
                {detail.score != null ? Number(detail.score).toFixed(1) : '-'}
              </span>
            </div>
            <div>
              <span className='text-muted-foreground'>发布时间：</span>
              <span>{formatDateTime(detail.publishedAt)}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>创建时间：</span>
              <span>{formatDateTime(detail.createdAt)}</span>
            </div>
            {detail.keywords && (
              <div className='col-span-2'>
                <span className='text-muted-foreground'>关键词：</span>
                <span>{detail.keywords}</span>
              </div>
            )}
            {detail.externalUrl && (
              <div className='col-span-2'>
                <span className='text-muted-foreground'>外部链接：</span>
                <a
                  href={detail.externalUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='text-primary hover:underline break-all'
                >
                  {detail.externalUrl}
                </a>
              </div>
            )}
          </div>
        </div>

        {detail.intro && (
          <div className='mt-4 pt-4 border-t'>
            <span className='text-sm text-muted-foreground'>课程简介：</span>
            <p className='text-sm mt-1 whitespace-pre-wrap'>{detail.intro}</p>
          </div>
        )}

        {detail.rejectReason && (
          <div className='mt-4 pt-4 border-t'>
            <span className='text-sm text-destructive'>驳回理由：</span>
            <p className='text-sm mt-1 whitespace-pre-wrap'>{detail.rejectReason}</p>
          </div>
        )}
      </div>

      {/* 系列与章节 */}
      {(detail.seriesList?.length ?? 0) > 0 && (
        <div className='rounded-lg border p-6'>
          <h4 className='font-semibold mb-4'>视频系列</h4>
          <div className='space-y-4'>
            {detail.seriesList!.map((series) => (
              <div key={series.id} className='rounded-md border p-3'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='font-medium'>{series.title}</span>
                  <span className='text-xs text-muted-foreground'>
                    共 {series.chapterCount ?? series.chapters?.length ?? 0} 节
                  </span>
                </div>
                {series.description && (
                  <p className='text-sm text-muted-foreground mb-2 whitespace-pre-wrap'>
                    {series.description}
                  </p>
                )}
                <ChapterList chapters={series.chapters ?? []} />
              </div>
            ))}
          </div>
        </div>
      )}

      {(detail.standaloneChapters?.length ?? 0) > 0 && (
        <div className='rounded-lg border p-6'>
          <h4 className='font-semibold mb-4'>独立章节</h4>
          <ChapterList chapters={detail.standaloneChapters!} />
        </div>
      )}
    </div>
  );
}

function ChapterList({ chapters }: { chapters: VideoChapter[] }) {
  if (!chapters || chapters.length === 0) {
    return <p className='text-sm text-muted-foreground'>暂无章节</p>;
  }
  return (
    <div className='divide-y'>
      {chapters.map((c, idx) => (
        <div
          key={c.id}
          className='py-2 flex items-center justify-between gap-2 text-sm'
        >
          <div className='flex items-center gap-3 min-w-0'>
            <span className='text-muted-foreground shrink-0'>
              {String(idx + 1).padStart(2, '0')}
            </span>
            <span className='truncate'>{c.title}</span>
            {c.isPreview === 1 && (
              <Badge variant='outline' className='text-xs'>
                可试看
              </Badge>
            )}
          </div>
          <span className='text-muted-foreground shrink-0'>
            {formatDuration(c.duration)}
          </span>
        </div>
      ))}
    </div>
  );
}
