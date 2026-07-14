'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { allianceLecturer721ApplicationDetailQueryOptions } from '../../api/queries';
import { ALLIANCE_LECTURER721_STATUS_MAP } from '../../api/types';
import { resolveAssetUrl } from '@/lib/resolve-asset-url';

type ApplicationDetailDialogProps = {
  applicationId: number;
};

function displayDate(value: string | null) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-';
}

export function ApplicationDetailDialog({
  applicationId
}: ApplicationDetailDialogProps) {
  const [open, setOpen] = useState(false);
  const { data, isPending, isError } = useQuery({
    ...allianceLecturer721ApplicationDetailQueryOptions(applicationId),
    enabled: open
  });
  const application = data?.data;
  const fields = application
    ? [
        ['申请 ID', application.id],
        ['用户 ID', application.userId],
        ['申请编号', application.applicationCode],
        ['讲师姓名', application.lecturerName],
        ['身份证号', application.idCardNo],
        ['合作年限', `${application.coopYears}年`],
        ['课酬(元/天)', application.dailyFee],
        ['地址', application.address],
        ['手机号', application.phone],
        ['微信', application.wechat],
        ['Email', application.email],
        ['开户银行', application.bankName],
        ['账号', application.bankAccount],
        ['协议版本', application.agreementVersion],
        ['审核状态', ALLIANCE_LECTURER721_STATUS_MAP[application.status]],
        ['驳回原因', application.rejectReason || '-'],
        ['审核时间', displayDate(application.reviewedAt)],
        ['审核人 ID', application.reviewedBy ?? '-'],
        ['提交时间', displayDate(application.createdAt)],
        ['更新时间', displayDate(application.updatedAt)]
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size='sm' variant='outline' onClick={() => setOpen(true)}>
        详情
      </Button>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>721讲师合作申请详情</DialogTitle>
          <DialogDescription>申请资料与审核记录</DialogDescription>
        </DialogHeader>
        {isPending ? (
          <p className='text-muted-foreground py-8 text-center text-sm'>
            正在加载...
          </p>
        ) : isError || !application ? (
          <p className='text-destructive py-8 text-center text-sm'>
            详情加载失败
          </p>
        ) : (
          <div className='space-y-4'>
            <dl className='grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2'>
              {fields.map(([label, value]) => (
                <div
                  key={String(label)}
                  className='grid grid-cols-[88px_1fr] gap-2'
                >
                  <dt className='text-muted-foreground'>{label}</dt>
                  <dd className='break-all'>{value}</dd>
                </div>
              ))}
            </dl>
            <div>
              <p className='text-muted-foreground mb-2 text-sm'>签字</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  application.signatureUrl.startsWith('/uploads/')
                    ? application.signatureUrl
                    : resolveAssetUrl(application.signatureUrl)
                }
                alt='签字'
                referrerPolicy='no-referrer'
                className='max-h-40 rounded border bg-white object-contain'
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
