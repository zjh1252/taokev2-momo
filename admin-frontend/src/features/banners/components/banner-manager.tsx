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
const EMPTY_ITEMS: RecommendedResourceItem[] = [];
const EMPTY_ITEM_QUERY: BannerItemsQuery = {
  items: EMPTY_ITEMS,
  unavailable: false
};

const DEFAULT_TOPIC_BUTTON_LINK = '/trainer/field=MBA%2F总裁班.htm';

type BannerForm = {
  position: number;
  coverUrl: string;
  consultButtonImageUrl: string;
  topicButtonImageUrl: string;
  topicButtonLinkUrl: string;
};

type BannerItemsQuery = {
  items: RecommendedResourceItem[];
  unavailable: boolean;
  message?: string;
};

type UploadField = 'coverUrl' | 'consultButtonImageUrl' | 'topicButtonImageUrl';

const DEFAULT_BANNERS: BannerForm[] = [
  {
    position: 1,
    coverUrl: '/statics/images/banner改/无按钮/Frame 26.png',
    consultButtonImageUrl: '/statics/images/banner改/按钮/橙色/Frame 28.png',
    topicButtonImageUrl: '/statics/images/banner改/按钮/橙色/Frame 29.png',
    topicButtonLinkUrl: DEFAULT_TOPIC_BUTTON_LINK
  },
  {
    position: 2,
    coverUrl: '/statics/images/banner改/无按钮/Frame 28.png',
    consultButtonImageUrl: '/statics/images/banner改/按钮/紫色/紫1.png',
    topicButtonImageUrl: '/statics/images/banner改/按钮/紫色/紫2.png',
    topicButtonLinkUrl: DEFAULT_TOPIC_BUTTON_LINK
  },
  {
    position: 3,
    coverUrl: '/statics/images/banner改/无按钮/Frame 30.png',
    consultButtonImageUrl: '/statics/images/banner改/按钮/蓝色/蓝1.png',
    topicButtonImageUrl: '/statics/images/banner改/按钮/蓝色/蓝2.png',
    topicButtonLinkUrl: DEFAULT_TOPIC_BUTTON_LINK
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
      consultButtonImageUrl:
        item?.consultButtonImageUrl?.trim() || fallback.consultButtonImageUrl,
      topicButtonImageUrl:
        item?.topicButtonImageUrl?.trim() || fallback.topicButtonImageUrl,
      topicButtonLinkUrl:
        item?.topicButtonLinkUrl?.trim() || fallback.topicButtonLinkUrl
    };
  });
}

function findItem(items: RecommendedResourceItem[], position: number) {
  return items.find(
    (item) => item.resourceType === RESOURCE_TYPE && item.resourceId === position
  );
}

function uploadKey(position: number, field: UploadField) {
  return `${position}-${field}`;
}

export function BannerManager() {
  const queryClient = useQueryClient();
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [forms, setForms] = useState<BannerForm[]>(DEFAULT_BANNERS);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
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
        consultButtonImageUrl: form.consultButtonImageUrl.trim(),
        topicButtonImageUrl: form.topicButtonImageUrl.trim(),
        topicButtonLinkUrl: form.topicButtonLinkUrl.trim(),
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

  const updateForm = (position: number, patch: Partial<BannerForm>) => {
    setForms((current) =>
      current.map((form) =>
        form.position === position ? { ...form, ...patch } : form
      )
    );
  };

  const handleUpload = async (
    position: number,
    field: UploadField,
    file: File | undefined
  ) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }
    const key = uploadKey(position, field);
    setUploadingKey(key);
    try {
      const url = await uploadImageFile(file);
      updateForm(position, { [field]: url });
      toast.success('图片上传成功，请保存配置');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '图片上传失败');
    } finally {
      setUploadingKey(null);
    }
  };

  const handleSave = async (form: BannerForm) => {
    if (!form.coverUrl.trim()) {
      toast.error('请上传或填写轮播图大图');
      return;
    }
    setSavingPosition(form.position);
    try {
      await saveMutation.mutateAsync(form);
    } catch {
      // onError 已负责展示错误提示，避免未捕获 Promise 触发 Next Runtime Error。
    }
  };

  const renderImageField = (
    form: BannerForm,
    field: UploadField,
    label: string,
    placeholder: string
  ) => {
    const key = uploadKey(form.position, field);
    const uploading = uploadingKey === key;
    const previewUrl = form[field];

    return (
      <div className='space-y-2'>
        <Label htmlFor={`banner-${field}-${form.position}`}>{label}</Label>
        <div className='relative aspect-[4/1] overflow-hidden rounded-md border bg-muted'>
          <AssetImage
            src={previewUrl}
            alt={label}
            fill
            wrapperClassName='h-full w-full'
            className='object-contain p-2'
            fallback={
              <div className='flex h-full w-full items-center justify-center text-sm text-muted-foreground'>
                暂无图片
              </div>
            }
          />
        </div>
        <Input
          id={`banner-${field}-${form.position}`}
          value={previewUrl}
          onChange={(event) =>
            updateForm(form.position, { [field]: event.target.value })
          }
          placeholder={placeholder}
        />
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={uploading}
          onClick={() => inputRefs.current[key]?.click()}
        >
          {uploading ? (
            <Icons.spinner className='size-4 animate-spin' />
          ) : (
            <Icons.upload className='size-4' />
          )}
          上传{label}
        </Button>
        <input
          ref={(node) => {
            inputRefs.current[key] = node;
          }}
          type='file'
          accept='image/*'
          className='hidden'
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            void handleUpload(form.position, field, file);
          }}
        />
      </div>
    );
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
                {renderImageField(
                  form,
                  'coverUrl',
                  '轮播大图',
                  '上传后自动填入 OSS 图片地址'
                )}
                {renderImageField(
                  form,
                  'consultButtonImageUrl',
                  '立即咨询按钮图',
                  '立即咨询按钮图片地址'
                )}
                {renderImageField(
                  form,
                  'topicButtonImageUrl',
                  '查看专题按钮图',
                  '查看专题按钮图片地址'
                )}

                <div className='space-y-2'>
                  <Label htmlFor={`banner-topic-link-${form.position}`}>查看专题跳转地址</Label>
                  <Input
                    id={`banner-topic-link-${form.position}`}
                    value={form.topicButtonLinkUrl}
                    onChange={(event) =>
                      updateForm(form.position, { topicButtonLinkUrl: event.target.value })
                    }
                    placeholder='/trainer/field=MBA%2F总裁班.htm 或 https://...'
                  />
                </div>

                <Button
                  type='button'
                  isLoading={saving}
                  disabled={saving}
                  onClick={() => void handleSave(form)}
                >
                  保存配置
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
