'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import {
  getTrainerMessageDetail,
  markTrainerMessageProcessed,
  convertTrainerMessageToDemand,
} from '@/features/trainer-messages/api/service';
import type { AdminTrainerMessage } from '@/features/trainer-messages/api/types';
import { MessageDetailView } from '@/features/trainer-messages/components/message-detail-view';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function TrainerMessageDetailPage(props: PageProps) {
  const { id } = use(props.params);
  const router = useRouter();
  const [message, setMessage] = useState<AdminTrainerMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [converting, setConverting] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await getTrainerMessageDetail(Number(id));
      setMessage(res.data);
    } catch {
      toast.error('获取留言详情失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleProcess = async () => {
    setProcessing(true);
    try {
      await markTrainerMessageProcessed(Number(id));
      toast.success('已标记为已处理');
      await fetchDetail();
    } catch {
      // apiClient 已统一处理错误
    } finally {
      setProcessing(false);
    }
  };

  const handleConvertToDemand = async () => {
    setConverting(true);
    try {
      const res = await convertTrainerMessageToDemand(Number(id));
      toast.success(`已转为需求 ${res.data.demandNo}`);
      router.push(`/dashboard/demands/${res.data.id}`);
    } catch {
      // apiClient 已统一处理错误
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer pageTitle='留言详情'>
        <div className='flex items-center justify-center py-20'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      </PageContainer>
    );
  }

  if (!message) {
    return (
      <PageContainer pageTitle='留言详情'>
        <div className='text-center py-20 text-muted-foreground'>留言不存在</div>
      </PageContainer>
    );
  }

  const isProcessed = message.status === 2;
  const canConvert = message.status === 0;

  return (
    <PageContainer
      scrollable
      pageTitle='留言详情'
      pageHeaderAction={
        <div className='flex items-center gap-2'>
          {canConvert && (
            <Button onClick={handleConvertToDemand} isLoading={converting}>
              <Icons.arrowRight className='mr-1 h-4 w-4' />
              转为需求
            </Button>
          )}
          {!isProcessed && (
            <Button onClick={handleProcess} isLoading={processing}>
              <Icons.check className='mr-1 h-4 w-4' />
              标记已处理
            </Button>
          )}
          <Button
            variant='outline'
            onClick={() => router.push('/dashboard/trainer-messages')}
          >
            返回列表
          </Button>
        </div>
      }
    >
      <MessageDetailView message={message} />
    </PageContainer>
  );
}
