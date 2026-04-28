'use client';

import { Badge } from '@/components/ui/badge';
import {
  MESSAGE_STATUS_MAP,
  type AdminTrainerMessage,
} from '../api/types';

/**
 * 留言详情卡片
 *
 * @author Fangxinxin
 * @date 2026-04-28 19:55
 */
function statusVariant(
  status: number,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 0:
      return 'secondary';
    case 1:
      return 'outline';
    case 2:
      return 'default';
    default:
      return 'outline';
  }
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN');
}

function formatRegion(message: AdminTrainerMessage): string {
  const ids = [message.provinceId, message.cityId, message.districtId].filter(
    (id): id is number => id != null && id > 0,
  );
  return ids.length > 0 ? `[${ids.join('/')}]` : '-';
}

export function MessageDetailView({
  message,
}: {
  message: AdminTrainerMessage;
}) {
  return (
    <div className='space-y-6'>
      <div className='rounded-lg border p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold'>{message.trainingTopic}</h3>
          <Badge variant={statusVariant(message.status)}>
            {MESSAGE_STATUS_MAP[message.status] ?? message.statusLabel ?? '未知'}
          </Badge>
        </div>

        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div>
            <span className='text-muted-foreground'>留言 ID：</span>
            <span>{message.id}</span>
          </div>
          <div>
            <span className='text-muted-foreground'>目标专家：</span>
            <span>
              {message.trainerNickname ?? '-'}
              {message.trainerUserId
                ? ` (#${message.trainerUserId})`
                : ''}
            </span>
          </div>
          <div>
            <span className='text-muted-foreground'>联系人：</span>
            <span>{message.contactName}</span>
          </div>
          <div>
            <span className='text-muted-foreground'>联系手机：</span>
            <span>{message.contactMobile}</span>
          </div>
          <div>
            <span className='text-muted-foreground'>公司名称：</span>
            <span>{message.companyName}</span>
          </div>
          <div>
            <span className='text-muted-foreground'>公司电话：</span>
            <span>{message.companyPhone || '-'}</span>
          </div>
          <div>
            <span className='text-muted-foreground'>邮箱：</span>
            <span>{message.email || '-'}</span>
          </div>
          <div>
            <span className='text-muted-foreground'>培训天数：</span>
            <span>{message.trainingDays || '-'}</span>
          </div>
          <div>
            <span className='text-muted-foreground'>培训地区：</span>
            <span>{formatRegion(message)}</span>
          </div>
          <div>
            <span className='text-muted-foreground'>提交人：</span>
            <span>
              {message.userNickname ?? '匿名'}
              {message.userId ? ` (#${message.userId})` : ''}
            </span>
          </div>
          <div>
            <span className='text-muted-foreground'>提交时间：</span>
            <span>{formatDateTime(message.createdAt)}</span>
          </div>
          <div>
            <span className='text-muted-foreground'>最近更新：</span>
            <span>{formatDateTime(message.updatedAt)}</span>
          </div>
        </div>

        {message.trainingGoal && (
          <div className='mt-4 pt-4 border-t'>
            <span className='text-sm text-muted-foreground'>培训目标：</span>
            <p className='text-sm mt-1 whitespace-pre-wrap'>
              {message.trainingGoal}
            </p>
          </div>
        )}

        {message.remark && (
          <div className='mt-4 pt-4 border-t'>
            <span className='text-sm text-muted-foreground'>备注：</span>
            <p className='text-sm mt-1 whitespace-pre-wrap'>{message.remark}</p>
          </div>
        )}
      </div>
    </div>
  );
}
