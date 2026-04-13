'use client';

import { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter
} from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { apiClient } from '@/lib/api-client';

interface OverviewStats {
  totalUsers: number;
  monthUsers: number;
  totalTrainers: number;
  monthTrainers: number;
  totalCourses: number;
  monthCourses: number;
  totalOrders: number;
  monthOrders: number;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

const CARDS = [
  {
    key: 'users' as const,
    label: '用户总数',
    totalField: 'totalUsers' as const,
    monthField: 'monthUsers' as const,
    monthLabel: '本月新增用户',
    icon: Icons.teams
  },
  {
    key: 'trainers' as const,
    label: '专家总数',
    totalField: 'totalTrainers' as const,
    monthField: 'monthTrainers' as const,
    monthLabel: '本月新增专家',
    icon: Icons.kanban
  },
  {
    key: 'courses' as const,
    label: '课程总数',
    totalField: 'totalCourses' as const,
    monthField: 'monthCourses' as const,
    monthLabel: '本月新增课程',
    icon: Icons.laptop
  },
  {
    key: 'orders' as const,
    label: '订单总数',
    totalField: 'totalOrders' as const,
    monthField: 'monthOrders' as const,
    monthLabel: '本月新增订单',
    icon: Icons.forms
  }
] as const;

/**
 * 后台首页概览 — 展示用户、专家、课程、订单统计
 *
 * @author Fangxinxin
 * @date 2026-04-13 16:00
 */
export default function OverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<ApiResponse<OverviewStats>>('/stats/overview')
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight'>淘课网后台</h2>
        </div>

        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          {CARDS.map((card) => {
            const total = stats?.[card.totalField] ?? 0;
            const month = stats?.[card.monthField] ?? 0;
            const Icon = card.icon;

            return (
              <Card key={card.key} className='@container/card'>
                <CardHeader>
                  <CardDescription className='flex items-center gap-1'>
                    {Icon && <Icon className='size-4' />}
                    {card.label}
                  </CardDescription>
                  <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                    {loading ? '...' : total.toLocaleString()}
                  </CardTitle>
                  <CardAction>
                    <Badge variant='outline'>
                      +{loading ? '-' : month}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                  <div className='line-clamp-1 flex gap-2 font-medium'>
                    {card.monthLabel}
                    {month > 0 && <Icons.trendingUp className='size-4' />}
                  </div>
                  <div className='text-muted-foreground'>当月累计数据</div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
