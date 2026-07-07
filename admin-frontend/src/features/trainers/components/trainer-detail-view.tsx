'use client';

import { AssetImage } from '@/components/admin/asset-image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FrontendLink } from '@/components/admin/frontend-link';
import { Icons } from '@/components/icons';
import { getAdminUserDetailUrl, getTrainerPublicUrl } from '@/lib/frontend-links';
import { resolveAssetUrl } from '@/lib/resolve-asset-url';
import { updateTrainerDetail } from '../api/service';
import type { AdminTrainerUpdatePayload } from '../api/detail-types';
import {
  TRAINER_STATUS_MAP,
  REAL_NAME_CERT_STATUS_MAP,
  type AdminTrainerDetail
} from '../api/types';

export type TrainerDetailMode = 'application' | 'full';

type Props = {
  detail: AdminTrainerDetail;
  mode: TrainerDetailMode;
  onUpdated?: (detail: AdminTrainerDetail) => void;
};

const GENDER_LABEL: Record<number, string> = {
  0: '未知',
  1: '男',
  2: '女'
};

export function TrainerDetailView({ detail, mode, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AdminTrainerUpdatePayload>(() => toForm(detail));

  const avatar = resolveAssetUrl(detail.avatar);
  const trainerRole = detail.roles?.find((r) => r.role === 'TRAINER');
  const isReapplying = trainerRole?.reapplying === true;
  const isPendingApply = trainerRole?.status === 2;
  const showFullSections = mode === 'full';

  const cityLabel = useMemo(() => {
    const parts = [detail.provinceName, detail.cityName].filter(Boolean);
    return parts.length ? parts.join(' / ') : detail.cityId ? `城市 ID: ${detail.cityId}` : '-';
  }, [detail]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateTrainerDetail(detail.id, form);
      toast.success('保存成功');
      setEditing(false);
      onUpdated?.(res.data);
    } catch {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(toForm(detail));
    setEditing(false);
  };

  return (
    <div className='space-y-6'>
      {(isReapplying || isPendingApply) && mode === 'application' && (
        <div className='rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900'>
          {isReapplying ? (
            <>
              <span className='font-medium'>重提申请</span>
              <span className='ml-2 text-amber-800'>
                专家已修改资料并重新提交，以下为最新申请内容，请核对后审核。
              </span>
            </>
          ) : (
            <>
              <span className='font-medium'>待审核入驻</span>
              <span className='ml-2 text-amber-800'>
                以下为专家提交的入驻资料，请核对后通过或驳回。
              </span>
            </>
          )}
        </div>
      )}

      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex flex-wrap items-center gap-3'>
          <Badge variant={statusVariant(detail.status)}>
            {TRAINER_STATUS_MAP[detail.status] ?? '未知'}
          </Badge>
          {detail.isRecommended === 1 ? <Badge>推荐</Badge> : null}
          <FrontendLink href={getTrainerPublicUrl(detail.id)} className='text-sm'>
            查看前台页
          </FrontendLink>
        </div>
        <div className='flex gap-2'>
          {editing ? (
            <>
              <Button variant='outline' size='sm' onClick={handleCancel} disabled={saving}>
                取消
              </Button>
              <Button size='sm' isLoading={saving} onClick={handleSave}>
                保存
              </Button>
            </>
          ) : (
            <Button variant='outline' size='sm' onClick={() => setEditing(true)}>
              <Icons.edit className='mr-1 h-4 w-4' />
              编辑资料
            </Button>
          )}
        </div>
      </div>

      <div className='flex gap-6'>
        <AssetImage
          src={avatar}
          alt={detail.name || ''}
          fill
          wrapperClassName='h-24 w-24 shrink-0 rounded-full'
          className='object-cover'
          fallback={
            <div className='flex h-24 w-24 items-center justify-center rounded-full bg-muted'>
              <Icons.user className='h-8 w-8 text-muted-foreground' />
            </div>
          }
        />
        <div className='space-y-1'>
          <h2 className='text-xl font-semibold'>{detail.name || '未命名'}</h2>
          {detail.title ? (
            <p className='text-muted-foreground text-sm'>{detail.title}</p>
          ) : null}
          {detail.trainerCode ? (
            <p className='text-muted-foreground text-xs'>编号：{detail.trainerCode}</p>
          ) : null}
        </div>
      </div>

      <Tabs defaultValue='basic'>
        <TabsList className='flex h-auto flex-wrap'>
          <TabsTrigger value='basic'>基本信息</TabsTrigger>
          {showFullSections ? <TabsTrigger value='maintainer'>维护人</TabsTrigger> : null}
          <TabsTrigger value='professional'>专业信息</TabsTrigger>
          {showFullSections ? <TabsTrigger value='resources'>资源信息</TabsTrigger> : null}
        </TabsList>

        <TabsContent value='basic' className='mt-4 space-y-4'>
          <SectionCard title='基本信息'>
            {editing ? (
              <div className='grid gap-4 md:grid-cols-2'>
                <FieldInput label='真实姓名' value={form.name ?? ''} onChange={(v) => setField(setForm, 'name', v)} />
                <FieldInput label='授课姓名' value={form.teachingName ?? ''} onChange={(v) => setField(setForm, 'teachingName', v)} />
                <FieldInput label='头衔/职称' value={form.title ?? ''} onChange={(v) => setField(setForm, 'title', v)} />
                <div className='space-y-1'>
                  <Label>性别</Label>
                  <Select
                    value={String(form.gender ?? 0)}
                    onValueChange={(v) => setField(setForm, 'gender', Number(v))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value='0'>未知</SelectItem>
                      <SelectItem value='1'>男</SelectItem>
                      <SelectItem value='2'>女</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <FieldInput label='联系电话' value={form.phone ?? ''} onChange={(v) => setField(setForm, 'phone', v)} />
                <FieldInput label='常用邮箱' value={form.email ?? ''} onChange={(v) => setField(setForm, 'email', v)} />
                <FieldInput label='身份证号' value={form.idCardNo ?? ''} onChange={(v) => setField(setForm, 'idCardNo', v)} />
                <FieldInput label='省份 ID' value={String(form.provinceId ?? '')} onChange={(v) => setField(setForm, 'provinceId', v ? Number(v) : null)} />
                <FieldInput label='城市 ID' value={String(form.cityId ?? '')} onChange={(v) => setField(setForm, 'cityId', v ? Number(v) : null)} />
                <FieldInput label='头像 URL' value={form.avatar ?? ''} onChange={(v) => setField(setForm, 'avatar', v)} />
                <FieldInput label='简历 URL' value={form.resumeUrl ?? ''} onChange={(v) => setField(setForm, 'resumeUrl', v)} />
              </div>
            ) : (
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                <Info label='简历' value={<ResumeLink url={detail.resumeUrl} />} />
                <Info label='头像' value={detail.avatar ? '已上传' : '-'} />
                <Info
                  label='真实姓名'
                  value={
                    <div className='flex flex-wrap items-center gap-2'>
                      <span>{detail.name || '-'}</span>
                      {detail.name ? (
                        <>
                          <FrontendLink href={getTrainerPublicUrl(detail.id)} className='text-xs'>
                            查看主页
                          </FrontendLink>
                          <a
                            href={`https://www.baidu.com/s?wd=${encodeURIComponent(detail.name)}`}
                            target='_blank'
                            rel='noreferrer'
                            className='text-primary text-xs hover:underline'
                          >
                            搜索
                          </a>
                        </>
                      ) : null}
                    </div>
                  }
                />
                <Info label='授课姓名' value={detail.teachingName || '-'} />
                <Info label='头衔/职称' value={detail.title || '-'} />
                <Info label='性别' value={GENDER_LABEL[detail.gender ?? 0] ?? '-'} />
                <Info label='联系电话' value={detail.phone || '-'} />
                <Info label='常用邮箱' value={detail.email || '-'} />
                <Info label='身份证号' value={detail.idCardNo || '-'} />
                <Info label='常驻城市' value={cityLabel} />
                <Info
                  label='关联用户'
                  value={
                    <Link href={getAdminUserDetailUrl(detail.userId)} className='text-primary hover:underline'>
                      {detail.nickname || `用户 #${detail.userId}`}
                    </Link>
                  }
                />
                <Info label='专家 ID' value={detail.id} />
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {showFullSections ? (
          <TabsContent value='maintainer' className='mt-4'>
            <SectionCard title='维护人' description='专家被助理/经纪人/经纪公司/机构绑定后自动展示'>
              {detail.maintainers?.length ? (
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b text-left text-muted-foreground'>
                        <th className='pb-2 pr-4 font-medium'>类型</th>
                        <th className='pb-2 pr-4 font-medium'>联系人</th>
                        <th className='pb-2 pr-4 font-medium'>联系电话</th>
                        <th className='pb-2 font-medium'>机构/公司</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.maintainers.map((m, i) => (
                        <tr key={`${m.roleType}-${i}`} className='border-b last:border-0'>
                          <td className='py-2 pr-4'>{m.roleLabel}</td>
                          <td className='py-2 pr-4'>{m.contactName || '-'}</td>
                          <td className='py-2 pr-4'>{m.contactPhone || '-'}</td>
                          <td className='py-2'>{m.orgName || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className='text-muted-foreground text-sm'>暂无绑定维护人</p>
              )}
            </SectionCard>
          </TabsContent>
        ) : null}

        <TabsContent value='professional' className='mt-4 space-y-4'>
          <SectionCard title='专业信息'>
            {editing ? (
              <div className='grid gap-4'>
                <FieldTextarea label='一句话介绍' value={form.oneLineIntro ?? ''} onChange={(v) => setField(setForm, 'oneLineIntro', v)} />
                <FieldTextarea label='个人简介' value={form.bio ?? ''} onChange={(v) => setField(setForm, 'bio', v)} rows={4} />
                <FieldTextarea label='详细介绍' value={form.intro ?? ''} onChange={(v) => setField(setForm, 'intro', v)} rows={4} />
                <FieldTextarea label='实战经历' value={form.background ?? ''} onChange={(v) => setField(setForm, 'background', v)} rows={3} />
                <FieldTextarea label='服务过客户' value={form.partialClients ?? ''} onChange={(v) => setField(setForm, 'partialClients', v)} rows={3} />
                <FieldInput label='擅长行业（文本）' value={form.goodAt ?? ''} onChange={(v) => setField(setForm, 'goodAt', v)} />
                <FieldInput label='擅长领域（文本）' value={form.specialties ?? ''} onChange={(v) => setField(setForm, 'specialties', v)} />
                <FieldInput label='关键标签' value={form.expertiseTags ?? ''} onChange={(v) => setField(setForm, 'expertiseTags', v)} />
                <FieldInput label='授课风格' value={form.teachingStyle ?? ''} onChange={(v) => setField(setForm, 'teachingStyle', v)} />
                <div className='grid gap-4 md:grid-cols-2'>
                  <FieldInput label='从业年限' value={String(form.experienceYears ?? '')} onChange={(v) => setField(setForm, 'experienceYears', v ? Number(v) : null)} />
                  <FieldInput label='授课年限' value={String(form.teachingYears ?? '')} onChange={(v) => setField(setForm, 'teachingYears', v ? Number(v) : null)} />
                  <FieldInput label='淘课网售价（元/天）' value={String(form.taokePrice ?? '')} onChange={(v) => setField(setForm, 'taokePrice', v ? Number(v) : null)} />
                  <FieldInput label='淘课合作课酬（元/天）' value={String(form.taokeCommission ?? '')} onChange={(v) => setField(setForm, 'taokeCommission', v ? Number(v) : null)} />
                  <FieldInput label='最低报价' value={String(form.quoteMin ?? '')} onChange={(v) => setField(setForm, 'quoteMin', v ? Number(v) : null)} />
                  <FieldInput label='最高报价' value={String(form.quoteMax ?? '')} onChange={(v) => setField(setForm, 'quoteMax', v ? Number(v) : null)} />
                  <FieldInput label='报价单位' value={form.quoteUnit ?? ''} onChange={(v) => setField(setForm, 'quoteUnit', v)} />
                </div>
                <FieldTextarea label='报价备注' value={form.quoteRemark ?? ''} onChange={(v) => setField(setForm, 'quoteRemark', v)} rows={2} />
              </div>
            ) : (
              <div className='grid gap-4 md:grid-cols-2'>
                <Info label='一句话介绍' value={detail.oneLineIntro || '-'} />
                <Info label='个人简介' value={<TextBlock text={detail.bio} />} />
                <Info label='详细介绍' value={<TextBlock text={detail.intro} />} />
                <Info label='荣誉与资质' value={<HonorList honors={detail.honors} fallback={detail.background} />} />
                <Info label='擅长行业' value={formatCategories(detail.industryCategories) || detail.goodAt || '-'} />
                <Info label='擅长领域' value={formatCategories(detail.expertiseCategories) || detail.specialties || detail.expertiseTags || '-'} />
                <Info label='关键标签' value={detail.expertiseTags || '-'} />
                <Info label='授课风格' value={detail.teachingStyle || '-'} />
                <Info label='实战经历' value={<TextBlock text={detail.background} />} />
                <Info label='服务过客户' value={<TextBlock text={detail.partialClients} />} />
                <Info label='从业年限' value={detail.experienceYears != null ? `${detail.experienceYears} 年` : '-'} />
                <Info label='授课年限' value={detail.teachingYears != null ? `${detail.teachingYears} 年` : '-'} />
                <Info label='我的著作' value={<BookList books={detail.books} />} />
                <Info label='淘课网售价' value={formatPrice(detail.taokePrice, '元/天')} />
                <Info label='淘课合作课酬' value={formatPrice(detail.taokeCommission, '元/天')} />
                <Info label='报价备注' value={detail.quoteRemark || '-'} />
                <Info label='实名认证' value={certLabel(detail.realNameCertStatus)} />
                <Info label='专业认证' value={certLabel(detail.professionalCertStatus)} />
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {showFullSections ? (
          <TabsContent value='resources' className='mt-4 space-y-4'>
            <ResourceSection
              title='主讲课程'
              items={detail.courses}
              addHref={`/dashboard/courses?trainerId=${detail.id}`}
              emptyHint='暂无课程'
            />
            <ResourceSection
              title='授课案例'
              items={detail.cases}
              addHref={`/dashboard/trainers/cases?trainerId=${detail.id}`}
              emptyHint='暂无案例'
            />
            <ResourceSection
              title='录播课'
              items={detail.videos}
              addHref='/dashboard/videos/new'
              emptyHint='暂无录播课'
            />
            <ResourceSection
              title='精彩瞬间'
              items={detail.highlights}
              addHref={`/dashboard/trainers/highlights?trainerId=${detail.id}`}
              emptyHint='暂无精彩瞬间'
            />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}

function ResourceSection({
  title,
  items,
  addHref,
  emptyHint
}: {
  title: string;
  items?: { id: number; title: string; statusLabel?: string | null; adminPath?: string | null }[] | null;
  addHref: string;
  emptyHint: string;
}) {
  return (
    <SectionCard
      title={title}
      action={
        <Button variant='outline' size='sm' asChild>
          <Link href={addHref}>
            <Icons.add className='mr-1 h-4 w-4' />
            添加
          </Link>
        </Button>
      }
    >
      {items?.length ? (
        <ul className='divide-y rounded-md border'>
          {items.map((item) => (
            <li key={item.id} className='flex items-center justify-between gap-3 px-3 py-2 text-sm'>
              <Link href={item.adminPath || '#'} className='text-primary hover:underline'>
                {item.title}
              </Link>
              {item.statusLabel ? (
                <Badge variant='outline' className='shrink-0 text-xs'>
                  {item.statusLabel}
                </Badge>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className='text-muted-foreground text-sm'>{emptyHint}</p>
      )}
    </SectionCard>
  );
}

function SectionCard({
  title,
  description,
  action,
  children
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className='rounded-lg border p-4'>
      <div className='mb-3 flex items-start justify-between gap-2'>
        <div>
          <h3 className='font-medium'>{title}</h3>
          {description ? (
            <p className='text-muted-foreground mt-0.5 text-xs'>{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='rounded-lg border p-3'>
      <div className='text-muted-foreground mb-1 text-xs'>{label}</div>
      <div className='text-sm'>{value}</div>
    </div>
  );
}

function TextBlock({ text }: { text?: string | null }) {
  if (!text) return <>-</>;
  return <p className='whitespace-pre-wrap leading-relaxed'>{text}</p>;
}

function ResumeLink({ url }: { url?: string | null }) {
  if (!url) return <>-</>;
  const href = resolveAssetUrl(url);
  return (
    <a href={href} target='_blank' rel='noreferrer' className='text-primary hover:underline'>
      下载/查看简历
    </a>
  );
}

function HonorList({
  honors,
  fallback
}: {
  honors?: { honorName: string; issuingAuthority?: string | null }[] | null;
  fallback?: string | null;
}) {
  if (honors?.length) {
    return (
      <ul className='list-inside list-disc space-y-1'>
        {honors.map((h, i) => (
          <li key={i}>
            {h.honorName}
            {h.issuingAuthority ? `（${h.issuingAuthority}）` : ''}
          </li>
        ))}
      </ul>
    );
  }
  return <TextBlock text={fallback} />;
}

function BookList({
  books
}: {
  books?: { title?: string | null; author?: string | null }[] | null;
}) {
  if (!books?.length) return <>-</>;
  return (
    <ul className='list-inside list-disc space-y-1'>
      {books.map((b, i) => (
        <li key={i}>{b.title}{b.author ? ` — ${b.author}` : ''}</li>
      ))}
    </ul>
  );
}

function FieldInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className='space-y-1'>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function FieldTextarea({
  label,
  value,
  onChange,
  rows = 3
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className='space-y-1'>
      <Label>{label}</Label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} />
    </div>
  );
}

function formatCategories(
  cats?: { categoryName?: string | null }[] | null
): string {
  if (!cats?.length) return '';
  return cats.map((c) => c.categoryName).filter(Boolean).join('、');
}

function formatPrice(val?: number | null, unit?: string) {
  if (val == null) return '-';
  return `${val}${unit ? ` ${unit}` : ''}`;
}

function certLabel(status?: number | null) {
  if (status == null) return '未提交';
  return REAL_NAME_CERT_STATUS_MAP[status] ?? String(status);
}

function statusVariant(
  status: number
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 2:
      return 'default';
    case 1:
      return 'secondary';
    case 3:
    case 4:
      return 'destructive';
    default:
      return 'outline';
  }
}

function toForm(detail: AdminTrainerDetail): AdminTrainerUpdatePayload {
  return {
    name: detail.name,
    teachingName: detail.teachingName,
    avatar: detail.avatar,
    title: detail.title,
    gender: detail.gender,
    phone: detail.phone,
    email: detail.email,
    provinceId: detail.provinceId,
    cityId: detail.cityId,
    idCardNo: detail.idCardNo,
    resumeUrl: detail.resumeUrl,
    bio: detail.bio,
    oneLineIntro: detail.oneLineIntro,
    intro: detail.intro,
    background: detail.background,
    partialClients: detail.partialClients,
    goodAt: detail.goodAt,
    specialties: detail.specialties,
    expertiseTags: detail.expertiseTags,
    teachingStyle: detail.teachingStyle,
    experienceYears: detail.experienceYears,
    teachingYears: detail.teachingYears,
    quoteMin: detail.quoteMin ?? undefined,
    quoteMax: detail.quoteMax ?? undefined,
    quoteUnit: detail.quoteUnit,
    quoteRemark: detail.quoteRemark,
    taokePrice: detail.taokePrice ?? undefined,
    taokeCommission: detail.taokeCommission ?? undefined,
    expertiseCategoryIds: detail.expertiseCategories?.map((c) => c.categoryId) ?? [],
    industryCategoryIds: detail.industryCategories?.map((c) => c.categoryId) ?? [],
    honors: detail.honors ?? []
  };
}

function setField<K extends keyof AdminTrainerUpdatePayload>(
  setter: React.Dispatch<React.SetStateAction<AdminTrainerUpdatePayload>>,
  key: K,
  value: AdminTrainerUpdatePayload[K]
) {
  setter((prev) => ({ ...prev, [key]: value }));
}
