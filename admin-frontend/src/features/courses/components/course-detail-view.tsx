'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { resolveAssetUrl } from '@/lib/resolve-asset-url';
import {
  COURSE_STATUS_MAP,
  type AdminCourseDetail,
} from '../api/types';

/**
 * 课程详情卡片
 *
 * <p>仅做信息展示，行操作（审核 / 上下架 / 主打）继续走列表 row action。</p>
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

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN');
}

export function CourseDetailView({ detail }: { detail: AdminCourseDetail }) {
  const cover = resolveAssetUrl(detail.coverUrl);
  return (
    <div className='space-y-6'>
      {/* 基础信息 */}
      <div className='rounded-lg border p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold'>{detail.title}</h3>
          <div className='flex items-center gap-2'>
            {detail.isFeatured === 1 && <Badge>主打</Badge>}
            {detail.isFree === 1 && <Badge variant='outline'>免费</Badge>}
            <Badge variant={statusVariant(detail.status)}>
              {COURSE_STATUS_MAP[detail.status] ?? detail.statusLabel ?? '未知'}
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
              <span className='text-muted-foreground'>课程 ID：</span>
              <span>{detail.id}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>课程类型：</span>
              <span>{detail.typeLabel}</span>
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
            {detail.durationDays != null && (
              <div>
                <span className='text-muted-foreground'>培训天数：</span>
                <span>{detail.durationDays} 天</span>
              </div>
            )}
            {detail.hoursPerDay != null && (
              <div>
                <span className='text-muted-foreground'>每日课时：</span>
                <span>{detail.hoursPerDay} 小时</span>
              </div>
            )}
            <div>
              <span className='text-muted-foreground'>发布者：</span>
              <span>
                {detail.publisherName ?? '-'}
                {detail.publisherType ? ` (${detail.publisherType})` : ''}
              </span>
            </div>
            <div>
              <span className='text-muted-foreground'>授课专家：</span>
              <span>{detail.trainerName ?? '-'}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>浏览量：</span>
              <span>{detail.viewCount?.toLocaleString() ?? 0}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>报名数：</span>
              <span>{detail.enrollmentCount?.toLocaleString() ?? 0}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>评分：</span>
              <span>{detail.score != null ? Number(detail.score).toFixed(1) : '-'}</span>
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
          </div>
        </div>

        {detail.rejectReason && (
          <div className='mt-4 pt-4 border-t'>
            <span className='text-sm text-destructive'>驳回理由：</span>
            <p className='text-sm mt-1 whitespace-pre-wrap'>{detail.rejectReason}</p>
          </div>
        )}
      </div>

      {/* 内容介绍 */}
      {(detail.intro || detail.audience || detail.highlights || detail.syllabus) && (
        <div className='rounded-lg border p-6'>
          <h4 className='font-semibold mb-3'>课程介绍</h4>
          <div className='space-y-4 text-sm'>
            {detail.intro && (
              <Section label='课程简介' value={detail.intro} />
            )}
            {detail.audience && (
              <Section label='适用人群' value={detail.audience} />
            )}
            {detail.highlights && (
              <Section label='课程亮点' value={detail.highlights} />
            )}
            {detail.syllabus && (
              <Section label='课程大纲' value={detail.syllabus} />
            )}
          </div>
        </div>
      )}

      {/* 开课计划 */}
      {detail.plans && detail.plans.length > 0 && (
        <div className='rounded-lg border p-6'>
          <h4 className='font-semibold mb-4'>开课计划（{detail.plans.length}）</h4>
          <div className='space-y-3'>
            {detail.plans.map((p) => (
              <div key={p.id} className='rounded-md border p-3 text-sm'>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <span className='text-muted-foreground'>开始：</span>
                    <span>{formatDateTime(p.startTime)}</span>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>结束：</span>
                    <span>{formatDateTime(p.endTime)}</span>
                  </div>
                  {p.address && (
                    <div className='col-span-2'>
                      <span className='text-muted-foreground'>线下地址：</span>
                      <span>{p.address}</span>
                    </div>
                  )}
                  {p.onlineUrl && (
                    <div className='col-span-2'>
                      <span className='text-muted-foreground'>线上链接：</span>
                      <a
                        href={p.onlineUrl}
                        target='_blank'
                        rel='noreferrer'
                        className='text-primary hover:underline break-all'
                      >
                        {p.onlineUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className='text-muted-foreground mb-1'>{label}</div>
      <p className='whitespace-pre-wrap'>{value}</p>
    </div>
  );
}
