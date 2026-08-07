'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import {
  getDemandDetail,
  changeDemandStatus,
  addDemandFollowUp
} from '@/features/demands/api/service';
import {
  DEMAND_STATUS_MAP,
  DEMAND_STATUS_OPTIONS,
  FOLLOW_UP_ACTION_OPTIONS,
  type AdminDemandDetail
} from '@/features/demands/api/types';

type PageProps = {
  params: Promise<{ id: string }>;
};

const statusVariantMap: Record<
  number,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  1: 'outline',
  2: 'default',
  3: 'secondary',
  4: 'default',
  5: 'destructive'
};

export default function DemandDetailPage(props: PageProps) {
  const { id } = use(props.params);
  const router = useRouter();
  const [detail, setDetail] = useState<AdminDemandDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // 状态变更表单
  const [newStatus, setNewStatus] = useState('');
  const [statusContent, setStatusContent] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // 跟进表单
  const [followAction, setFollowAction] = useState('CS_NOTE');
  const [followContent, setFollowContent] = useState('');
  const [followSubmitting, setFollowSubmitting] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await getDemandDetail(Number(id));
      setDetail(res.data);
    } catch {
      toast.error('获取需求详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleStatusChange = async () => {
    if (!newStatus) {
      toast.error('请选择目标状态');
      return;
    }
    setStatusSubmitting(true);
    try {
      await changeDemandStatus(Number(id), Number(newStatus), statusContent);
      toast.success('状态变更成功');
      setNewStatus('');
      setStatusContent('');
      await fetchDetail();
    } catch {
      // apiClient 已处理
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleAddFollowUp = async () => {
    if (!followContent.trim()) {
      toast.error('请输入跟进内容');
      return;
    }
    setFollowSubmitting(true);
    try {
      await addDemandFollowUp(Number(id), followAction, followContent);
      toast.success('跟进记录添加成功');
      setFollowContent('');
      await fetchDetail();
    } catch {
      // apiClient 已处理
    } finally {
      setFollowSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer pageTitle='需求详情'>
        <div className='flex items-center justify-center py-20'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      </PageContainer>
    );
  }

  if (!detail) {
    return (
      <PageContainer pageTitle='需求详情'>
        <div className='text-center py-20 text-muted-foreground'>
          需求不存在
        </div>
      </PageContainer>
    );
  }

  const isTerminal = detail.status === 4 || detail.status === 5;

  const formatBudget = () => {
    if (detail.budgetMin == null && detail.budgetMax == null) return '面议';
    if (detail.budgetMin != null && detail.budgetMax != null)
      return `${detail.budgetMin.toLocaleString()} - ${detail.budgetMax.toLocaleString()}元`;
    if (detail.budgetMin != null)
      return `${detail.budgetMin.toLocaleString()}元起`;
    return `最高${detail.budgetMax!.toLocaleString()}元`;
  };

  const formatTrainingRegion = () => {
    if (detail.format === 'ONLINE') return '无';
    if (detail.trainingRegion?.trim()) return detail.trainingRegion.trim();
    const joined = [detail.provinceName, detail.cityName, detail.districtName]
      .filter(Boolean)
      .join(' ');
    return joined || '—';
  };

  return (
    <PageContainer
      scrollable
      pageTitle='需求详情'
      pageHeaderAction={
        <Button variant='outline' onClick={() => router.push('/dashboard/demands')}>
          返回列表
        </Button>
      }
    >
      <div className='space-y-6'>
        {/* 基本信息卡片 */}
        <div className='rounded-lg border p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold'>
              {detail.title || detail.trainingTopic || '培训需求'}
            </h3>
            <Badge variant={statusVariantMap[detail.status] ?? 'outline'}>
              {DEMAND_STATUS_MAP[detail.status] ?? detail.statusLabel}
            </Badge>
          </div>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <span className='text-muted-foreground'>需求单号：</span>
              <span className='font-mono'>{detail.demandNo}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>需求 ID：</span>
              <span>{detail.id}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>需求类型：</span>
              <span>{detail.demandTypeLabel}</span>
            </div>
            {detail.trainingTopic && (
              <div>
                <span className='text-muted-foreground'>培训主题：</span>
                <span>{detail.trainingTopic}</span>
              </div>
            )}
            <div>
              <span className='text-muted-foreground'>预算：</span>
              <span className='font-medium'>{formatBudget()}</span>
            </div>
            {detail.traineeCount && (
              <div>
                <span className='text-muted-foreground'>培训人数：</span>
                <span>{detail.traineeCount}人</span>
              </div>
            )}
            {detail.formatLabel && (
              <div>
                <span className='text-muted-foreground'>培训形式：</span>
                <span>{detail.formatLabel}</span>
              </div>
            )}
            <div>
              <span className='text-muted-foreground'>培训地区：</span>
              <span>{formatTrainingRegion()}</span>
            </div>
            {detail.expectedStartDate && (
              <div>
                <span className='text-muted-foreground'>期望开始：</span>
                <span>{detail.expectedStartDate}</span>
              </div>
            )}
            {detail.contactName && (
              <div>
                <span className='text-muted-foreground'>联系人：</span>
                <span>{detail.contactName}</span>
              </div>
            )}
            {detail.contactPhone && (
              <div>
                <span className='text-muted-foreground'>联系电话：</span>
                <span>{detail.contactPhone}</span>
              </div>
            )}
            <div>
              <span className='text-muted-foreground'>用户 ID：</span>
              <span>{detail.userId ?? '游客'}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>提交时间：</span>
              <span>
                {new Date(detail.createdAt).toLocaleString('zh-CN')}
              </span>
            </div>
          </div>
          {detail.description && (
            <div className='mt-4 pt-4 border-t'>
              <span className='text-sm text-muted-foreground'>
                详细描述：
              </span>
              <p className='text-sm mt-1 whitespace-pre-wrap'>
                {detail.description}
              </p>
            </div>
          )}
        </div>

        {/* 操作区 — 非终态时显示 */}
        {!isTerminal && (
          <div className='grid grid-cols-2 gap-6'>
            {/* 状态变更 */}
            <div className='rounded-lg border p-4'>
              <h4 className='font-semibold mb-3'>变更状态</h4>
              <div className='space-y-3'>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder='选择目标状态' />
                  </SelectTrigger>
                  <SelectContent>
                    {DEMAND_STATUS_OPTIONS.filter(
                      (o) => Number(o.value) !== detail.status
                    ).map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder='变更备注（选填）'
                  value={statusContent}
                  onChange={(e) => setStatusContent(e.target.value)}
                  rows={2}
                />
                <Button
                  onClick={handleStatusChange}
                  isLoading={statusSubmitting}
                  size='sm'
                >
                  确认变更
                </Button>
              </div>
            </div>

            {/* 添加跟进 */}
            <div className='rounded-lg border p-4'>
              <h4 className='font-semibold mb-3'>添加跟进</h4>
              <div className='space-y-3'>
                <Select value={followAction} onValueChange={setFollowAction}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FOLLOW_UP_ACTION_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder='跟进内容'
                  value={followContent}
                  onChange={(e) => setFollowContent(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={handleAddFollowUp}
                  isLoading={followSubmitting}
                  variant='outline'
                  size='sm'
                >
                  添加记录
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 跟进记录时间线 */}
        <div className='rounded-lg border p-6'>
          <h4 className='font-semibold mb-4'>跟进记录</h4>
          {detail.followUps.length === 0 ? (
            <p className='text-sm text-muted-foreground'>暂无跟进记录</p>
          ) : (
            <div className='relative pl-6 border-l-2 border-border space-y-6'>
              {detail.followUps.map((f) => (
                <div key={f.id} className='relative'>
                  <div className='absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-background' />
                  <div className='text-sm'>
                    <div className='flex items-center gap-2 mb-1'>
                      <span className='font-medium'>{f.actionLabel}</span>
                      {f.newStatusLabel && (
                        <Badge variant='outline' className='text-xs'>
                          {f.oldStatusLabel
                            ? `${f.oldStatusLabel} → `
                            : ''}
                          {f.newStatusLabel}
                        </Badge>
                      )}
                    </div>
                    {f.content && (
                      <p className='text-muted-foreground'>{f.content}</p>
                    )}
                    <span className='text-xs text-muted-foreground mt-1 block'>
                      {new Date(f.createdAt).toLocaleString('zh-CN')}
                      {f.operatorName && ` · ${f.operatorName}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
