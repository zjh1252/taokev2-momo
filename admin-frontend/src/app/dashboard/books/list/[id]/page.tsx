'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { InlineAuditActions } from '@/components/admin/inline-audit-actions';
import { getBookDetail, approveBook, rejectBook } from '@/features/books/api/service';
import { bookKeys } from '@/features/books/api/queries';
import type { AdminBook } from '@/features/books/api/types';
import { BOOK_STATUS_MAP } from '@/features/books/api/types';
import { getAdminUserDetailUrl } from '@/lib/frontend-links';
import { AssetImage } from '@/components/admin/asset-image';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function BookDetailPage(props: PageProps) {
  const { id } = use(props.params);
  const router = useRouter();
  const [detail, setDetail] = useState<AdminBook | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getBookDetail(Number(id));
        if (!cancelled) setDetail(res.data);
      } catch {
        if (!cancelled) toast.error('获取著作详情失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <PageContainer pageTitle='著作详情'>
        <div className='flex items-center justify-center py-20'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      </PageContainer>
    );
  }

  if (!detail) {
    return (
      <PageContainer pageTitle='著作详情'>
        <p className='text-muted-foreground py-10 text-center'>著作不存在或加载失败</p>
      </PageContainer>
    );
  }

  const isPending = detail.status === 0;

  return (
    <PageContainer
      pageTitle='著作详情'
      pageHeaderAction={
        <Button variant='outline' onClick={() => router.back()}>
          <Icons.chevronLeft className='mr-1 h-4 w-4' />
          返回
        </Button>
      }
    >
      <div className='flex flex-col gap-6 lg:flex-row'>
        {detail.coverUrl ? (
          <AssetImage
            src={detail.coverUrl}
            alt={detail.title}
            width={160}
            height={220}
            className='h-56 w-40 shrink-0 rounded-lg object-cover'
          />
        ) : null}
        <div className='flex-1 space-y-4'>
          <div className='flex flex-wrap items-center gap-2'>
            <h2 className='text-xl font-semibold'>{detail.title}</h2>
            <Badge>{BOOK_STATUS_MAP[detail.status] ?? detail.statusLabel}</Badge>
          </div>
          <InlineAuditActions
            showApprove={isPending}
            showReject={isPending}
            subjectLabel={detail.title}
            onApprove={() => approveBook(detail.id)}
            onReject={(reason) => rejectBook(detail.id, reason)}
            invalidateKey={bookKeys.all}
          />
          <dl className='grid gap-3 sm:grid-cols-2'>
            <Item label='著作ID' value={detail.id} />
            <Item label='专家/作者' value={detail.authorName || detail.trainerName || '-'} />
            <Item
              label='用户名'
              value={
                detail.submitterNickname && detail.submitterUserId ? (
                  <Link
                    href={getAdminUserDetailUrl(detail.submitterUserId)}
                    className='text-primary hover:underline'
                  >
                    {detail.submitterNickname}
                  </Link>
                ) : (
                  '-'
                )
              }
            />
            <Item label='出版社' value={detail.publisher || '-'} />
            <Item label='出版时间' value={detail.publishDate || '-'} />
            <Item
              label='创建时间'
              value={new Date(detail.createdAt).toLocaleString('zh-CN')}
            />
          </dl>
          {detail.description ? (
            <div>
              <h3 className='mb-1 font-medium'>简介</h3>
              <p className='text-muted-foreground text-sm whitespace-pre-wrap'>
                {detail.description}
              </p>
            </div>
          ) : null}
          {detail.rejectReason ? (
            <p className='text-destructive text-sm'>驳回原因：{detail.rejectReason}</p>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className='text-muted-foreground text-xs'>{label}</dt>
      <dd className='text-sm font-medium'>{value}</dd>
    </div>
  );
}
