'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AssetImage } from '@/components/admin/asset-image';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import { uploadImageFile } from '@/features/materials/api/service';
import { ApiError, assertApiOk } from '@/lib/api-client';
import { recommendationKeys } from '@/features/recommendations/api/queries';
import {
  addRecommendation,
  getRecommendations,
  updateRecommendation
} from '@/features/recommendations/api/service';
import type { RecommendedResourceItem } from '@/features/recommendations/api/types';

const SLOT_CODE = 'HOME_BANNER';
const RESOURCE_TYPE = 'BANNER';
const DEFAULT_IMAGE = '/statics/images/hero-banner.jpg';
const EMPTY_ITEMS: RecommendedResourceItem[] = [];
const EMPTY_ITEM_QUERY: BannerItemsQuery = {
  items: EMPTY_ITEMS,
  unavailable: false
};

type BannerForm = {
  position: number;
  coverUrl: string;
  tagline: string;
  title: string;
  description: string;
};

type BannerItemsQuery = {
  items: RecommendedResourceItem[];
  unavailable: boolean;
  message?: string;
};

const DEFAULT_BANNERS: BannerForm[] = [
  {
    position: 1,
    coverUrl: DEFAULT_IMAGE,
    tagline: '淘课网 2026 年度专题',
    title: '找得到、信得过、价更优、+AI',
    description: '汇聚全球 5000+ 顶尖商学院专家，为您的企业量身定制成长路径'
  },
  {
    position: 2,
    coverUrl: DEFAULT_IMAGE,
    tagline: '淘课网 2026 年度专题',
    title: '找得到、信得过、价更优、+AI',
    description: '汇聚全球 5000+ 顶尖商学院专家，为您的企业量身定制成长路径'
  },
  {
    position: 3,
    coverUrl: DEFAULT_IMAGE,
    tagline: '淘课网 2026 年度专题',
    title: '找得到、信得过、价更优、+AI',
    description: '汇聚全球 5000+ 顶尖商学院专家，为您的企业量身定制成长路径'
  }
];

function buildForms(items: RecommendedResourceItem[]): BannerForm[] {
  return DEFAULT_BANNERS.map((fallback) => {
    const item = items.find(
      (candidate) =>
        candidate.resourceType === RESOURCE_TYPE &&
        candidate.resourceId === fallback.position
    );
    return {
      position: fallback.position,
      coverUrl: item?.coverUrl?.trim() || fallback.coverUrl,
      tagline: item?.chiefIntro?.trim() || fallback.tagline,
      title: item?.title?.trim() || fallback.title,
      description: item?.description?.trim() || fallback.description
    };
  });
}

function findItem(items: RecommendedResourceItem[], position: number) {
  return items.find(
    (item) => item.resourceType === RESOURCE_TYPE && item.resourceId === position
  );
}

export function BannerManager() {
  const queryClient = useQueryClient();
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [forms, setForms] = useState<BannerForm[]>(DEFAULT_BANNERS);
  const [uploadingPosition, setUploadingPosition] = useState<number | null>(null);
  const [savingPosition, setSavingPosition] = useState<number | null>(null);

  const {
    data: itemQuery = EMPTY_ITEM_QUERY,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: recommendationKeys.list(SLOT_CODE),
    queryFn: async () => {
      try {
        const resp = await getRecommendations(SLOT_CODE);
        return {
          items: assertApiOk(resp) ?? EMPTY_ITEMS,
          unavailable: false
        };
      } catch (err) {
        if (err instanceof ApiError && err.status >= 500) {
          return {
            items: EMPTY_ITEMS,
            unavailable: true,
            message: err.message
          };
        }
        throw err;
      }
    }
  });
  const items = itemQuery.items;
  const itemListUnavailable = itemQuery.unavailable;

  useEffect(() => {
    setForms(buildForms(items));
  }, [items]);

  const saveMutation = useMutation({
    mutationFn: async (form: BannerForm) => {
      const payload = {
        coverUrl: form.coverUrl.trim(),
        chiefIntro: form.tagline.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        adminNote: `首页轮播图第 ${form.position} 张`
      };
      const existing = findItem(items, form.position);
      if (existing) {
        return assertApiOk(await updateRecommendation(existing.id, payload));
      }
      return assertApiOk(
        await addRecommendation({
          slotCode: SLOT_CODE,
          resourceType: RESOURCE_TYPE,
          resourceId: form.position,
          roleType: 'PRIMARY',
          ...payload
        })
      );
    },
    onSuccess: async () => {
      toast.success('轮播图已保存');
      await queryClient.invalidateQueries({
        queryKey: recommendationKeys.list(SLOT_CODE)
      });
    },
    onError: (err: Error) => {
      let message = err.message || '保存失败';
      if (itemListUnavailable || message.includes('系统繁忙')) {
        message =
          '图片已上传到 OSS，但轮播图配置没有保存成功。当前后端保存接口还未接住 HOME_BANNER/BANNER，请重新编译并重启 Java 后端后再保存。';
      }
      toast.error(message);
    },
    onSettled: () => setSavingPosition(null)
  });

  const updateForm = (
    position: number,
    patch: Partial<
      Pick<BannerForm, 'coverUrl' | 'tagline' | 'title' | 'description'>
    >
  ) => {
    setForms((current) =>
      current.map((form) =>
        form.position === position ? { ...form, ...patch } : form
      )
    );
  };

  const handleUpload = async (position: number, file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }
    setUploadingPosition(position);
    try {
      const url = await uploadImageFile(file);
      updateForm(position, { coverUrl: url });
      toast.success('图片上传成功，请保存配置');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '图片上传失败');
    } finally {
      setUploadingPosition(null);
    }
  };

  const handleSave = async (form: BannerForm) => {
    if (!form.coverUrl.trim()) {
      toast.error('请上传或填写轮播图图片');
      return;
    }
    if (!form.title.trim()) {
      toast.error('请输入轮播图 H1 标题');
      return;
    }
    if (!form.tagline.trim()) {
      toast.error('请输入轮播图顶部小字');
      return;
    }
    if (!form.description.trim()) {
      toast.error('请输入轮播图描述');
      return;
    }
    setSavingPosition(form.position);
    try {
      await saveMutation.mutateAsync(form);
    } catch {
      // onError 已负责展示错误提示，避免未捕获 Promise 触发 Next Runtime Error。
    }
  };

  if (isLoading) {
    return (
      <div className='flex h-48 items-center justify-center text-sm text-muted-foreground'>
        <Icons.spinner className='mr-2 size-4 animate-spin' />
        加载轮播图配置…
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>加载失败</CardTitle>
          <CardDescription>未能获取首页轮播图配置</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type='button' variant='outline' onClick={() => void refetch()}>
            <Icons.refresh className='size-4' />
            重新加载
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='grid gap-4 xl:grid-cols-3'>
        {forms.map((form) => {
        const existing = findItem(items, form.position);
        const uploading = uploadingPosition === form.position;
        const saving = savingPosition === form.position;

        return (
          <Card key={form.position} className='overflow-hidden'>
            <CardHeader>
              <div className='flex items-center justify-between gap-3'>
                <div className='space-y-1'>
                  <CardTitle>轮播图 {form.position}</CardTitle>
                  <CardDescription>首页顶部第 {form.position} 张展示图</CardDescription>
                </div>
                <Badge variant={existing ? 'default' : 'secondary'}>
                  {existing ? '已配置' : '待保存'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='relative aspect-[16/7] overflow-hidden rounded-md border bg-muted'>
                <AssetImage
                  src={form.coverUrl}
                  alt={`轮播图 ${form.position}`}
                  fill
                  wrapperClassName='h-full w-full'
                  className='object-cover'
                  fallback={
                    <div className='flex h-full w-full items-center justify-center text-sm text-muted-foreground'>
                      暂无图片
                    </div>
                  }
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor={`banner-cover-${form.position}`}>图片地址</Label>
                <Input
                  id={`banner-cover-${form.position}`}
                  value={form.coverUrl}
                  onChange={(event) =>
                    updateForm(form.position, { coverUrl: event.target.value })
                  }
                  placeholder='上传后自动填入 OSS 图片地址'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor={`banner-tagline-${form.position}`}>顶部小字</Label>
                <Input
                  id={`banner-tagline-${form.position}`}
                  value={form.tagline}
                  onChange={(event) =>
                    updateForm(form.position, { tagline: event.target.value })
                  }
                  placeholder='淘课网 2026 年度专题'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor={`banner-title-${form.position}`}>H1 标题</Label>
                <Input
                  id={`banner-title-${form.position}`}
                  value={form.title}
                  onChange={(event) =>
                    updateForm(form.position, { title: event.target.value })
                  }
                  placeholder='找得到、信得过、价更优、+AI'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor={`banner-description-${form.position}`}>描述</Label>
                <Textarea
                  id={`banner-description-${form.position}`}
                  value={form.description}
                  onChange={(event) =>
                    updateForm(form.position, { description: event.target.value })
                  }
                  rows={3}
                  placeholder='首页轮播图描述'
                />
              </div>

              <div className='flex flex-wrap gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  disabled={uploading}
                  onClick={() => inputRefs.current[form.position]?.click()}
                >
                  {uploading ? (
                    <Icons.spinner className='size-4 animate-spin' />
                  ) : (
                    <Icons.upload className='size-4' />
                  )}
                  上传图片
                </Button>
                <Button
                  type='button'
                  isLoading={saving}
                  disabled={saving}
                  onClick={() => void handleSave(form)}
                >
                  保存配置
                </Button>
              </div>

              <input
                ref={(node) => {
                  inputRefs.current[form.position] = node;
                }}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  void handleUpload(form.position, file);
                }}
              />
            </CardContent>
          </Card>
        );
        })}
      </div>
    </div>
  );
}
