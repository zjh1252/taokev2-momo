'use client';

import { AssetImage } from '@/components/admin/asset-image';
import { Badge } from '@/components/ui/badge';
import { resolveAssetUrl } from '@/lib/resolve-asset-url';
import {
  HIGHLIGHT_STATUS_MAP,
  type AdminTrainerHighlight,
  type TrainerHighlightFile,
} from '../api/types';

/**
 * 精彩瞬间详情卡片
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

export function HighlightDetailView({
  detail,
}: {
  detail: AdminTrainerHighlight;
}) {
  return (
    <div className='space-y-6'>
      <div className='rounded-lg border p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold'>{detail.title || '未命名'}</h3>
          <Badge variant={statusVariant(detail.status)}>
            {HIGHLIGHT_STATUS_MAP[detail.status] ?? '未知'}
          </Badge>
        </div>

        <div className='flex gap-6'>
          <AssetImage
            src={detail.coverImage}
            alt={detail.title || ''}
            fill
            wrapperClassName='h-28 w-48 shrink-0 rounded-md'
            className='object-cover'
          />
          <div className='grid grid-cols-2 gap-4 text-sm flex-1'>
            <div>
              <span className='text-muted-foreground'>瞬间 ID：</span>
              <span>{detail.id}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>所属主体：</span>
              <span>
                {detail.ownerSubjectName ?? detail.trainerName ?? '-'}
              </span>
            </div>
            <div>
              <span className='text-muted-foreground'>用户：</span>
              <span>{detail.submitterUsername ?? '-'}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>文件数：</span>
              <span>{detail.files?.length ?? 0}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>浏览量：</span>
              <span>{detail.viewCount?.toLocaleString() ?? 0}</span>
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

        {detail.description && (
          <div className='mt-4 pt-4 border-t'>
            <span className='text-sm text-muted-foreground'>描述：</span>
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
          <h4 className='font-semibold mb-4'>素材文件（{detail.files.length}）</h4>
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

function FileCard({ file }: { file: TrainerHighlightFile }) {
  const isVideo = file.fileType === 2;
  const url = resolveAssetUrl(file.fileUrl);
  const thumb = resolveAssetUrl(file.thumbnailUrl);
  return (
    <div className='rounded-md border overflow-hidden'>
      <div className='relative w-full h-32 bg-muted'>
        {isVideo ? (
          thumb ? (
            <AssetImage
              src={file.thumbnailUrl}
              alt={file.title || ''}
              fill
              wrapperClassName='h-full w-full'
              className='object-cover'
            />
          ) : (
            <div className='absolute inset-0 flex items-center justify-center text-xs text-muted-foreground'>
              视频文件
            </div>
          )
        ) : url ? (
          <AssetImage
            src={file.fileUrl}
            alt={file.title || ''}
            fill
            wrapperClassName='h-full w-full'
            className='object-cover'
          />
        ) : (
          <div className='absolute inset-0 flex items-center justify-center text-xs text-muted-foreground'>
            无预览
          </div>
        )}
        <Badge variant='secondary' className='absolute top-2 left-2 text-xs'>
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
