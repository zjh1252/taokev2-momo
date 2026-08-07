'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { OpenCourseEnrollment } from '../../api/types';
import { ENROLLMENT_STATUS_OPTIONS } from '../../api/types';
import { updateOpenCourseEnrollment } from '../../api/service';
import { openCourseEnrollmentKeys } from '../../api/queries';

interface CellActionProps {
  data: OpenCourseEnrollment;
}

function formatDt(value?: string | null) {
  if (!value) return '-';
  return value.replace('T', ' ').slice(0, 19);
}

export function CellAction({ data }: CellActionProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [status, setStatus] = useState(String(data.status));
  const [remark, setRemark] = useState(data.adminRemark ?? '');
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: () =>
      updateOpenCourseEnrollment(data.id, {
        status: Number(status),
        adminRemark: remark,
      }),
    onSuccess: () => {
      toast.success('已保存');
      setEditOpen(false);
      void queryClient.invalidateQueries({
        queryKey: openCourseEnrollmentKeys.all,
      });
    },
    onError: () => toast.error('保存失败'),
  });

  return (
    <>
      <div className='flex items-center gap-1'>
        <Button
          variant='ghost'
          size='sm'
          className='h-8 px-2'
          onClick={() => setDetailOpen(true)}
        >
          <Icons.info className='mr-1 h-4 w-4' />
          详情
        </Button>
        <Button
          variant='ghost'
          size='sm'
          className='h-8 px-2'
          onClick={() => {
            setStatus(String(data.status));
            setRemark(data.adminRemark ?? '');
            setEditOpen(true);
          }}
        >
          <Icons.edit className='mr-1 h-4 w-4' />
          编辑
        </Button>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>报名详情 #{data.id}</DialogTitle>
          </DialogHeader>
          <dl className='grid grid-cols-[7rem_1fr] gap-x-3 gap-y-2 text-sm'>
            <dt className='text-muted-foreground'>提交时间</dt>
            <dd>{formatDt(data.createdAt)}</dd>
            <dt className='text-muted-foreground'>真实姓名</dt>
            <dd>{data.realName}</dd>
            <dt className='text-muted-foreground'>公司名称</dt>
            <dd>{data.companyName}</dd>
            <dt className='text-muted-foreground'>电子邮件</dt>
            <dd>{data.email}</dd>
            <dt className='text-muted-foreground'>公司电话</dt>
            <dd>{data.companyPhone || '-'}</dd>
            <dt className='text-muted-foreground'>手机号码</dt>
            <dd>{data.mobile || '-'}</dd>
            <dt className='text-muted-foreground'>关联课程</dt>
            <dd>
              {data.courseTitle}
              <span className='text-muted-foreground ml-1'>#{data.courseId}</span>
            </dd>
            <dt className='text-muted-foreground'>期次开课</dt>
            <dd>
              {formatDt(data.planStartTime)} ~ {formatDt(data.planEndTime)}
            </dd>
            <dt className='text-muted-foreground'>处理状态</dt>
            <dd>{data.statusLabel}</dd>
            <dt className='text-muted-foreground'>运营备注</dt>
            <dd className='whitespace-pre-wrap'>{data.adminRemark || '-'}</dd>
          </dl>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>编辑状态与备注</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label>处理状态</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENROLLMENT_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>运营备注</Label>
              <Textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={4}
                placeholder='填写跟进备注'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditOpen(false)}>
              取消
            </Button>
            <Button
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
