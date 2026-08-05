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
import { alliancePartnerApplicationDetailQueryOptions } from '../../api/queries';
import { ALLIANCE_PARTNER_STATUS_MAP } from '../../api/types';

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
    ...alliancePartnerApplicationDetailQueryOptions(applicationId),
    enabled: open
  });
  const application = data?.data;
  const fields = application
    ? [
        ['申请 ID', application.id],
        ['用户 ID', application.userId],
        ['合伙人编号', application.partnerCode],
        ['联系人', application.contactName],
        ['公司名称', application.companyName],
        ['公司电话', application.companyPhone],
        ['公司邮箱', application.companyEmail],
        ['省份 ID', application.provinceId],
        ['城市 ID', application.cityId],
        ['公司法人', application.legalPerson],
        ['法人身份证', application.legalIdCard],
        ['联系人 QQ', application.contactQq || '-'],
        ['协议版本', application.agreementVersion],
        ['审核状态', ALLIANCE_PARTNER_STATUS_MAP[application.status]],
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
          <DialogTitle>培训合伙人申请详情</DialogTitle>
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
          <dl className='grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2'>
            {fields.map(([label, value]) => (
              <div key={String(label)} className='grid grid-cols-[88px_1fr] gap-2'>
                <dt className='text-muted-foreground'>{label}</dt>
                <dd className='break-all'>{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </DialogContent>
    </Dialog>
  );
}
