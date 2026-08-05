'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AssetImage } from '@/components/admin/asset-image';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { uploadImageFile } from '@/features/materials/api/service';
import {
  footerQueries,
  updateFooterConfigMutation,
  updateFooterLinkMutation,
  updateStaticPageMutation
} from '../api/mutations';
import { footerKeys } from '../api/queries';
import type {
  FooterConfig,
  FooterLinkItem,
  FooterLinkType,
  FooterSectionCode,
  StaticPageItem
} from '../api/types';
import {
  FOOTER_LINK_TYPE_LABELS
} from '../api/types';

function LinkEditor({
  link,
  page,
  onSaved
}: {
  link: FooterLinkItem;
  page?: StaticPageItem;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    label: link.label,
    linkType: link.linkType,
    linkTarget: link.linkTarget ?? '',
    qrImageUrl: link.qrImageUrl ?? '',
    enabled: link.enabled,
    openInNewTab: link.openInNewTab
  });
  const [pageForm, setPageForm] = useState({
    title: page?.title ?? link.label,
    content: page?.content ?? '',
    published: page?.published ?? true
  });

  const linkMut = useMutation({
    ...updateFooterLinkMutation,
    onSuccess: () => {
      toast.success(`${link.label} 已保存`);
      onSaved();
    },
    onError: (err) => toast.error(err.message || '保存失败')
  });

  const pageMut = useMutation({
    ...updateStaticPageMutation,
    onSuccess: () => {
      toast.success('页面内容已保存');
      onSaved();
    },
    onError: (err) => toast.error(err.message || '页面保存失败')
  });

  const uploadQr = async (file: File) => {
    const url = await uploadImageFile(file);
    setForm((prev) => ({ ...prev, qrImageUrl: url }));
  };

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='text-base'>{link.itemCode}</CardTitle>
        <CardDescription>{link.sectionCode}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid gap-2'>
          <Label>展示文案</Label>
          <Input
            value={form.label}
            onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
          />
        </div>
        <div className='grid gap-2'>
          <Label>链接类型</Label>
          <Select
            value={form.linkType}
            onValueChange={(value) => setForm((prev) => ({ ...prev, linkType: value as FooterLinkType }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FOOTER_LINK_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {form.linkType !== 'NONE' ? (
          <div className='grid gap-2'>
            <Label>{form.linkType === 'STATIC_PAGE' ? 'pageCode' : form.linkType === 'INTERNAL' ? '站内路径' : '外链 URL'}</Label>
            <Input
              value={form.linkTarget}
              onChange={(e) => setForm((prev) => ({ ...prev, linkTarget: e.target.value }))}
              placeholder={form.linkType === 'INTERNAL' ? '/articles' : form.linkType === 'STATIC_PAGE' ? 'ABOUT_TAOKE' : 'https://'}
            />
          </div>
        ) : null}
        {link.sectionCode === 'CONTACT' ? (
          <div className='grid gap-2'>
            <Label>二维码图片</Label>
            <div className='flex items-center gap-3'>
              {form.qrImageUrl ? (
                <AssetImage src={form.qrImageUrl} alt='二维码' className='h-20 w-20 rounded border object-cover' />
              ) : null}
              <Button type='button' variant='outline' size='sm' asChild>
                <label className='cursor-pointer'>
                  <Icons.upload className='mr-1 h-4 w-4' />
                  上传二维码
                  <input
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadQr(file);
                    }}
                  />
                </label>
              </Button>
            </div>
          </div>
        ) : null}
        <div className='flex items-center justify-between'>
          <Label>启用</Label>
          <Switch
            checked={form.enabled}
            onCheckedChange={(checked) => setForm((prev) => ({ ...prev, enabled: checked }))}
          />
        </div>
        {form.linkType === 'EXTERNAL' ? (
          <div className='flex items-center justify-between'>
            <Label>新窗口打开</Label>
            <Switch
              checked={form.openInNewTab}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, openInNewTab: checked }))}
            />
          </div>
        ) : null}
        <Button
          isLoading={linkMut.isPending}
          onClick={() =>
            linkMut.mutate({
              itemCode: link.itemCode,
              payload: {
                label: form.label,
                linkType: form.linkType,
                linkTarget: form.linkTarget || undefined,
                qrImageUrl: form.qrImageUrl || undefined,
                enabled: form.enabled,
                openInNewTab: form.openInNewTab
              }
            })
          }
        >
          保存链接
        </Button>
        {form.linkType === 'STATIC_PAGE' && form.linkTarget ? (
          <div className='space-y-3 border-t pt-4'>
            <Label className='text-sm font-medium'>静态页内容</Label>
            <Input
              value={pageForm.title}
              onChange={(e) => setPageForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder='页面标题'
            />
            <Textarea
              value={pageForm.content}
              onChange={(e) => setPageForm((prev) => ({ ...prev, content: e.target.value }))}
              rows={8}
              placeholder='支持 HTML 富文本'
            />
            <div className='flex items-center justify-between'>
              <Label>已发布</Label>
              <Switch
                checked={pageForm.published}
                onCheckedChange={(checked) => setPageForm((prev) => ({ ...prev, published: checked }))}
              />
            </div>
            <Button
              variant='secondary'
              isLoading={pageMut.isPending}
              onClick={() =>
                pageMut.mutate({
                  pageCode: form.linkTarget,
                  payload: pageForm
                })
              }
            >
              保存页面内容
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ConfigEditor({
  config,
  section,
  onSaved
}: {
  config: FooterConfig;
  section: FooterSectionCode;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(config);

  const mut = useMutation({
    ...updateFooterConfigMutation,
    onSuccess: () => {
      toast.success('配置已保存');
      onSaved();
    },
    onError: (err) => toast.error(err.message || '保存失败')
  });

  const uploadMainQr = async (file: File) => {
    const url = await uploadImageFile(file);
    setForm((prev) => ({ ...prev, mainQrImageUrl: url }));
  };

  if (section === 'NAV') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>品牌与简介</CardTitle>
          <CardDescription>对应首页底部第一列展示内容</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <div className='grid gap-2'>
            <Label>品牌副标题</Label>
            <Input
              value={form.brandTagline}
              onChange={(e) => setForm((prev) => ({ ...prev, brandTagline: e.target.value }))}
            />
          </div>
          <div className='grid gap-2'>
            <Label>公司简介</Label>
            <Textarea
              value={form.companyIntro ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, companyIntro: e.target.value }))}
              rows={4}
            />
          </div>
          <Button isLoading={mut.isPending} onClick={() => mut.mutate(form)}>
            保存品牌配置
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (section !== 'CONTACT') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>联系方式与版权</CardTitle>
        <CardDescription>电话、主二维码与底部版权信息</CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4 md:grid-cols-2'>
        <div className='grid gap-2'>
          <Label>联系电话</Label>
          <Input
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
        </div>
        <div className='grid gap-2'>
          <Label>ICP 备案号</Label>
          <Input
            value={form.icpText}
            onChange={(e) => setForm((prev) => ({ ...prev, icpText: e.target.value }))}
          />
        </div>
        <div className='grid gap-2 md:col-span-2'>
          <Label>主二维码</Label>
          <div className='flex items-center gap-3'>
            {form.mainQrImageUrl ? (
              <AssetImage src={form.mainQrImageUrl} alt='主二维码' className='h-24 w-24 rounded border object-cover' />
            ) : null}
            <Button type='button' variant='outline' size='sm' asChild>
              <label className='cursor-pointer'>
                <Icons.upload className='mr-1 h-4 w-4' />
                上传主二维码
                <input
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadMainQr(file);
                  }}
                />
              </label>
            </Button>
          </div>
        </div>
        <div className='grid gap-2 md:col-span-2'>
          <Label>Copyright</Label>
          <Input
            value={form.copyrightText}
            onChange={(e) => setForm((prev) => ({ ...prev, copyrightText: e.target.value }))}
          />
        </div>
        <div className='grid gap-2'>
          <Label>公司版权文案</Label>
          <Input
            value={form.companyCopyrightText}
            onChange={(e) => setForm((prev) => ({ ...prev, companyCopyrightText: e.target.value }))}
          />
        </div>
        <div className='grid gap-2'>
          <Label>公司版权链接</Label>
          <Input
            value={form.companyCopyrightUrl ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, companyCopyrightUrl: e.target.value }))}
            placeholder='可选'
          />
        </div>
        <div className='md:col-span-2'>
          <Button isLoading={mut.isPending} onClick={() => mut.mutate(form)}>
            保存联系与版权配置
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function FooterManager({ section }: { section: FooterSectionCode }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery(footerQueries.admin());

  const pagesByCode = useMemo(() => {
    const map = new Map<string, StaticPageItem>();
    data?.pages.forEach((page) => map.set(page.pageCode, page));
    return map;
  }, [data?.pages]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: footerKeys.all });
  };

  if (isLoading) {
    return <div className='text-muted-foreground text-sm'>加载中…</div>;
  }

  if (isError || !data) {
    return (
      <div className='text-destructive text-sm'>
        加载失败：{error instanceof Error ? error.message : '未知错误'}
      </div>
    );
  }

  const links = data.sections[section] ?? [];

  return (
    <div className='space-y-6'>
      <ConfigEditor config={data.config} section={section} onSaved={invalidate} />
      <div className='grid gap-4 md:grid-cols-2'>
        {links.map((link) => (
          <LinkEditor
            key={link.itemCode}
            link={link}
            page={
              link.linkType === 'STATIC_PAGE' && link.linkTarget
                ? pagesByCode.get(link.linkTarget)
                : undefined
            }
            onSaved={invalidate}
          />
        ))}
      </div>
    </div>
  );
}
