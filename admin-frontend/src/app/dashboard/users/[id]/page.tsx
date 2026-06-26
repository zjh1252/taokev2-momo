'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { getUserDetail } from '@/features/users/api/service';
import type { UserDetail } from '@/features/users/api/types';
import {
  REG_ORIGIN_MAP,
  REAL_NAME_CERT_STATUS_MAP
} from '@/features/users/api/types';
import { ROLE_LABEL_MAP } from '@/features/users/components/users-table/options';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function UserDetailPage(props: PageProps) {
  const { id } = use(props.params);
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getUserDetail(Number(id));
        if (!cancelled) setUser(res.data);
      } catch {
        if (!cancelled) toast.error('获取用户详情失败');
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
      <PageContainer pageTitle='用户详情'>
        <div className='flex items-center justify-center py-20'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer pageTitle='用户详情'>
        <p className='text-muted-foreground py-10 text-center'>
          用户不存在或加载失败
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      pageTitle='用户详情'
      pageDescription={`用户 ID: ${user.id}`}
      pageHeaderAction={
        <Button variant='outline' onClick={() => router.back()}>
          <Icons.chevronLeft className='mr-1 h-4 w-4' />
          返回
        </Button>
      }
    >
      <Tabs defaultValue='basic' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='basic'>基本信息</TabsTrigger>
          <TabsTrigger value='roles'>角色与认证</TabsTrigger>
          <TabsTrigger value='stats'>资源统计</TabsTrigger>
        </TabsList>

        <TabsContent value='basic' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            <Field label='ID' value={user.id} />
            <Field label='昵称' value={user.nickname || '-'} />
            <Field label='真实姓名' value={user.realName || '-'} />
            <Field label='手机号' value={user.phone || '-'} />
            <Field label='邮箱' value={user.email || '-'} />
            <Field label='用户名' value={user.username || '-'} />
            <Field
              label='性别'
              value={user.gender === 1 ? '男' : user.gender === 2 ? '女' : '-'}
            />
            <Field
              label='状态'
              value={user.status === 1 ? '正常' : '冻结'}
            />
            <Field
              label='注册来源'
              value={
                user.regOrigin != null
                  ? REG_ORIGIN_MAP[user.regOrigin] ?? user.regOrigin
                  : '-'
              }
            />
            <Field label='地址' value={user.address || '-'} />
            <Field
              label='最后登录'
              value={
                user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString('zh-CN')
                  : '-'
              }
            />
            <Field
              label='注册时间'
              value={
                user.createdAt
                  ? new Date(user.createdAt).toLocaleString('zh-CN')
                  : '-'
              }
            />
          </div>
        </TabsContent>

        <TabsContent value='roles' className='space-y-4'>
          <div className='rounded-lg border p-4'>
            <div className='text-muted-foreground mb-2 text-xs'>业务角色</div>
            <div className='flex flex-wrap gap-2'>
              {user.roles?.length ? (
                user.roles.map((r) => (
                  <Badge key={r.role} variant='outline'>
                    {ROLE_LABEL_MAP[r.role] || r.role}
                  </Badge>
                ))
              ) : (
                <span className='text-sm'>-</span>
              )}
            </div>
          </div>
          <div className='grid gap-4 md:grid-cols-2'>
            <Field
              label='实名认证'
              value={
                user.realNameCertStatus != null
                  ? REAL_NAME_CERT_STATUS_MAP[user.realNameCertStatus] ??
                    user.realNameCertStatus
                  : '未提交'
              }
            />
            {user.trainerId ? (
              <Field
                label='专家档案'
                value={
                  <Link
                    href={`/dashboard/trainers/${user.trainerId}`}
                    className='text-primary hover:underline'
                  >
                    专家 #{user.trainerId}
                  </Link>
                }
              />
            ) : (
              <Field label='专家档案' value='-' />
            )}
          </div>
        </TabsContent>

        <TabsContent value='stats'>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <Field label='课程数' value={user.courseCount ?? 0} />
            <Field label='案例数' value={user.caseCount ?? 0} />
            <Field label='视频数' value={user.videoCount ?? 0} />
            <Field
              label='冻结原因'
              value={user.freezeReason || '-'}
            />
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='rounded-lg border p-4'>
      <div className='text-muted-foreground mb-1 text-xs'>{label}</div>
      <div className='text-sm font-medium'>{value}</div>
    </div>
  );
}
