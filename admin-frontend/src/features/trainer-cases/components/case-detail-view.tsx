'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { resolveAssetUrl } from '@/lib/resolve-asset-url';
import {
  CASE_STATUS_MAP,
  type TrainerCaseDetail,
  type TrainerCaseFile,
} from '../api/types';

/**
 * 案例详情卡片
 *
 * @author Fangxinxin
 * @date 2026-04-28 19:55
 */
function statusVariant(
  status: number,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 1:
      return 'default';
    case 0:
      return 'secondary';
    case 2:
      return 'destructive';
    default:
      return 'outline';
  }
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN');
}

function formatRegion(detail: TrainerCaseDetail): string {
  const ids = [
    detail.provinceId,
    detail.cityId,
    detail.districtId,
    detail.townId,
  ].filter((id): id is number => id != null && id > 0);
  if (ids.length === 0 && !detail.trainingAddress) return '-';
  const region = ids.length > 0 ? `[${ids.join('/')}]` : '';
  return [region, detail.trainingAddress].filter(Boolean).join(' ');
}

export function CaseDetailView({ detail }: { detail: TrainerCaseDetail }) {
  const cover = resolveAssetUrl(detail.coverImage);
  return (
    <div className='space-y-6'>
      <div className='rounded-lg border p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold'>{detail.caseTitle}</h3>
          <Badge variant={statusVariant(detail.status)}>
            {CASE_STATUS_MAP[detail.status] ?? '未知'}
          </Badge>
        </div>

        <div className='flex gap-6'>
          {cover && (
            <div className='relative w-48 h-28 shrink-0 rounded-md overflow-hidden bg-muted'>
              <Image
                src={cover}
                alt={detail.caseTitle}
                fill
                className='object-cover'
                sizes='192px'
                unoptimized
              />
            </div>
          )}
          <div className='grid grid-cols-2 gap-4 text-sm flex-1'>
            <div>
              <span className='text-muted-foreground'>案例 ID：</span>
              <span>{detail.id}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>所属专家：</span>
              <span>
                {detail.trainerName ?? '-'}
                {detail.trainerId ? ` (#${detail.trainerId})` : ''}
              </span>
            </div>
            <div>
              <span className='text-muted-foreground'>企业名称：</span>
              <span>{detail.enterpriseName}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>所属行业：</span>
              <span>{detail.industry || '-'}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>培训主题：</span>
              <span>{detail.trainingTopic || '-'}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>培训日期：</span>
              <span>{detail.trainingDate || '-'}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>受训人数：</span>
              <span>
                {detail.traineeCount != null ? `${detail.traineeCount} 人` : '-'}
              </span>
            </div>
            <div>
              <span className='text-muted-foreground'>培训地点：</span>
              <span>{formatRegion(detail)}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>提交时间：</span>
              <span>{formatDateTime(detail.createdAt)}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>审核时间：</span>
              <span>{formatDateTime(detail.reviewedAt)}</span>
            </div>
          </div>
        </div>

        {detail.trainingEffect && (
          <div className='mt-4 pt-4 border-t'>
            <span className='text-sm text-muted-foreground'>培训效果：</span>
            <p className='text-sm mt-1 whitespace-pre-wrap'>
              {detail.trainingEffect}
            </p>
          </div>
        )}

        {detail.description && (
          <div className='mt-4 pt-4 border-t'>
            <span className='text-sm text-muted-foreground'>案例描述：</span>
            <p className='text-sm mt-1 whitespace-pre-wrap'>{detail.description}</p>
          </div>
        )}

        {detail.rejectReason && (
          <div className='mt-4 pt-4 border-t'>
            <span className='text-sm text-destructive'>驳回理由：</span>
            <p className='text-sm mt-1 whitespace-pre-wrap'>{detail.rejectReason}</p>
          </div>
        )}
      </div>

      {detail.files && detail.files.length > 0 && (
        <div className='rounded-lg border p-6'>
          <h4 className='font-semibold mb-4'>关联文件（{detail.files.length}）</h4>
          <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
            {detail.files.map((file) => (
              <FileCard key={file.id} file={file} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FileCard({ file }: { file: TrainerCaseFile }) {
  const isVideo = file.fileType === 2;
  const url = resolveAssetUrl(file.fileUrl);
  const thumb = resolveAssetUrl(file.thumbnailUrl);
  return (
    <div className='rounded-md border overflow-hidden'>
      <div className='relative w-full h-32 bg-muted'>
        {isVideo ? (
          thumb ? (
            <Image src={thumb} alt={file.title || ''} fill className='object-cover' unoptimized />
          ) : (
            <div className='absolute inset-0 flex items-center justify-center text-xs text-muted-foreground'>
              视频文件
            </div>
          )
        ) : url ? (
          <Image src={url} alt={file.title || ''} fill className='object-cover' unoptimized />
        ) : (
          <div className='absolute inset-0 flex items-center justify-center text-xs text-muted-foreground'>
            无预览
          </div>
        )}
        <Badge
          variant='secondary'
          className='absolute top-2 left-2 text-xs'
        >
          {isVideo ? '视频' : '图片'}
        </Badge>
      </div>
      <div className='p-2 text-xs space-y-1'>
        {file.title && <div className='truncate font-medium'>{file.title}</div>}
        <a
          href={url}
          target='_blank'
          rel='noreferrer'
          className='text-primary hover:underline truncate block'
        >
          查看原文件
        </a>
      </div>
    </div>
  );
}
