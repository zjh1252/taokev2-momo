'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSuspenseQuery } from '@tanstack/react-query';
import { videoOrderDetailQueryOptions } from '../api/queries';
import { VIDEO_ORDER_STATUS_MAP } from '../api/types';

interface Props {
  orderId: number;
}

export function VideoOrderDetailView({ orderId }: Props) {
  const { data: resp } = useSuspenseQuery(videoOrderDetailQueryOptions(orderId));
  const order = resp.data;

  if (!order) {
    return <div className='text-muted-foreground py-20 text-center'>订单不存在</div>;
  }

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            订单 {order.orderNo}
            <Badge>{VIDEO_ORDER_STATUS_MAP[order.status] ?? order.statusLabel}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className='grid gap-3 md:grid-cols-2 text-sm'>
          <div>购买用户：{order.userName}</div>
          <div>视频：{order.videoTitles || order.items?.[0]?.productTitle || '-'}</div>
          <div>支付金额：¥{order.payAmount.toLocaleString()}</div>
          <div>学习人数：{order.learnerCount}</div>
          <div>
            下单时间：
            {order.createdAt
              ? new Date(order.createdAt).toLocaleString('zh-CN')
              : '-'}
          </div>
          {order.paidAt ? (
            <div>支付时间：{new Date(order.paidAt).toLocaleString('zh-CN')}</div>
          ) : null}
        </CardContent>
      </Card>

      {order.items?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>订单明细</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 text-sm'>
            {order.items.map((item, idx) => (
              <div key={idx} className='rounded border p-3'>
                <div className='font-medium'>{item.productTitle}</div>
                <div className='text-muted-foreground'>
                  {item.productTypeLabel || item.productType} × {item.quantity}，
                  小计 ¥{item.subtotal.toLocaleString()}
                  {item.totalEpisodes ? `（${item.totalEpisodes} 集）` : ''}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
