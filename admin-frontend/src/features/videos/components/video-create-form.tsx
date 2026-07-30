'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import * as z from 'zod';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { createVideo } from '../api/service';
import { getCategoryTree } from '@/features/categories/api/service';
import type { CategoryNode } from '@/features/categories/api/types';
import { getTrainers } from '@/features/trainers/api/service';
import { getInstitutions } from '@/features/institutions/api/service';

const formSchema = z.object({
  title: z.string().min(1, '请输入视频标题'),
  categoryId: z.string().min(1, '请选择分类'),
  subCategoryId: z.string().optional(),
  videoType: z.enum(['SERIES', 'SINGLE', 'EXTERNAL']),
  videoUrl: z.string().optional(),
  externalUrl: z.string().optional(),
  coverUrl: z.string().min(1, '请上传录播封面'),
  publishMode: z.enum(['review', 'publish']),
  intro: z.string().optional(),
  publisherType: z.enum(['TRAINER', 'INSTITUTION']),
  publisherId: z.string().min(1, '请选择发布主体'),
  teacherName: z.string().optional(),
  durationMinutes: z.number().min(0).optional(),
  isFree: z.enum(['0', '1']),
  price: z.number().min(0).optional(),
  companyPrice: z.number().min(0).optional(),
  maxPurchaseQty: z.number().min(1).optional(),
  keywords: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

function flattenCategoryOptions(nodes: CategoryNode[]) {
  const options: { value: string; label: string; parentId: number }[] = [];
  const walk = (list: CategoryNode[], prefix = '') => {
    for (const node of list) {
      options.push({
        value: String(node.id),
        label: `${prefix}${node.name}`,
        parentId: node.parentId
      });
      if (node.children?.length) {
        walk(node.children, `${prefix}${node.name} / `);
      }
    }
  };
  walk(nodes);
  return options;
}

export function VideoCreateForm() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [publisherOptions, setPublisherOptions] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    void getCategoryTree('VIDEO_COURSE')
      .then((resp) => setCategories(resp.data ?? []))
      .catch(() => toast.error('加载分类失败'));
  }, []);

  const categoryOptions = useMemo(
    () => flattenCategoryOptions(categories),
    [categories]
  );

  const mutation = useMutation({
    mutationFn: createVideo,
    onSuccess: (resp) => {
      toast.success('视频创建成功');
      const id = resp.data?.id;
      router.push(id ? `/dashboard/videos/${id}` : '/dashboard/videos');
    },
    onError: () => toast.error('创建失败')
  });

  const form = useAppForm({
    defaultValues: {
      title: '',
      categoryId: '',
      subCategoryId: '',
      videoType: 'SINGLE',
      videoUrl: '',
      externalUrl: '',
      coverUrl: '',
      publishMode: 'review',
      intro: '',
      publisherType: 'TRAINER',
      publisherId: '',
      teacherName: '',
      durationMinutes: 0,
      isFree: '0',
      price: 0,
      companyPrice: 0,
      maxPurchaseQty: 20,
      keywords: ''
    } as FormValues,
    validators: {
      onSubmit: formSchema
    },
    onSubmit: ({ value }) => {
      const categoryId = Number(value.categoryId);
      const subCategoryId = value.subCategoryId
        ? Number(value.subCategoryId)
        : undefined;

      mutation.mutate({
        title: value.title,
        videoType: value.videoType,
        categoryId,
        subCategoryId,
        coverUrl: value.coverUrl,
        videoUrl: value.videoType === 'SINGLE' ? value.videoUrl : undefined,
        externalUrl: value.videoType === 'EXTERNAL' ? value.externalUrl : undefined,
        intro: value.intro,
        publisherType: value.publisherType,
        publisherId: Number(value.publisherId),
        teacherName: value.teacherName,
        duration: (value.durationMinutes ?? 0) * 60,
        isFree: Number(value.isFree),
        price: value.isFree === '1' ? 0 : value.price,
        companyPrice: value.companyPrice,
        maxPurchaseQty: value.maxPurchaseQty,
        keywords: value.keywords,
        draft: value.publishMode === 'review',
        directPublish: value.publishMode === 'publish'
      });
    }
  });

  const { FormTextField, FormTextareaField } = useFormFields<FormValues>();

  const loadPublishers = async (type: 'TRAINER' | 'INSTITUTION') => {
    try {
      if (type === 'TRAINER') {
        const resp = await getTrainers({ page: 1, limit: 100 });
        setPublisherOptions(
          (resp.data?.list ?? []).map((item) => ({
            value: String(item.userId),
            label: item.name || `专家 #${item.userId}`
          }))
        );
      } else {
        const resp = await getInstitutions({ page: 1, limit: 100 });
        setPublisherOptions(
          (resp.data?.list ?? []).map((item) => ({
            value: String(item.userId),
            label: item.orgName || `机构 #${item.userId}`
          }))
        );
      }
    } catch {
      toast.error('加载发布主体失败');
    }
  };

  useEffect(() => {
    void loadPublishers('TRAINER');
  }, []);

  return (
    <Card className='mx-auto w-full max-w-4xl'>
      <CardHeader>
        <CardTitle>添加视频</CardTitle>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='space-y-6'>
            <FormTextField
              name='title'
              label='视频标题'
              required
              placeholder='请输入视频标题'
            />

            <div className='grid gap-4 md:grid-cols-2'>
              <form.AppField name='categoryId'>
                {(field) => (
                  <div className='space-y-2'>
                    <Label>课程分类</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='选择分类' />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.AppField>

              <form.AppField name='videoType'>
                {(field) => (
                  <div className='space-y-2'>
                    <Label>视频类型</Label>
                    <RadioGroup
                      value={field.state.value}
                      onValueChange={(v) =>
                        field.handleChange(v as FormValues['videoType'])
                      }
                      className='flex gap-4'
                    >
                      <div className='flex items-center gap-2'>
                        <RadioGroupItem value='SINGLE' id='type-single' />
                        <Label htmlFor='type-single'>单门课程</Label>
                      </div>
                      <div className='flex items-center gap-2'>
                        <RadioGroupItem value='SERIES' id='type-series' />
                        <Label htmlFor='type-series'>系列课程</Label>
                      </div>
                      <div className='flex items-center gap-2'>
                        <RadioGroupItem value='EXTERNAL' id='type-external' />
                        <Label htmlFor='type-external'>外部链接</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </form.AppField>
            </div>

            <form.Subscribe selector={(s) => s.values.videoType}>
              {(videoType) => (
                <>
                  {videoType === 'SINGLE' && (
                    <FormTextField
                      name='videoUrl'
                      label='视频地址'
                      placeholder='上传后填写 URL 或粘贴外链'
                    />
                  )}
                  {videoType === 'EXTERNAL' && (
                    <FormTextField
                      name='externalUrl'
                      label='外部链接'
                      placeholder='https://'
                    />
                  )}
                </>
              )}
            </form.Subscribe>

            <FormTextField
              name='coverUrl'
              label='封面图 URL'
              required
              placeholder='粘贴封面图地址'
            />

            <form.AppField name='publishMode'>
              {(field) => (
                <div className='space-y-2'>
                  <Label>发布状态</Label>
                  <RadioGroup
                    value={field.state.value}
                    onValueChange={(v) =>
                      field.handleChange(v as FormValues['publishMode'])
                    }
                    className='flex gap-4'
                  >
                    <div className='flex items-center gap-2'>
                      <RadioGroupItem value='review' id='pub-review' />
                      <Label htmlFor='pub-review'>待审核</Label>
                    </div>
                    <div className='flex items-center gap-2'>
                      <RadioGroupItem value='publish' id='pub-direct' />
                      <Label htmlFor='pub-direct'>直接上架</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </form.AppField>

            <FormTextareaField
              name='intro'
              label='课程介绍'
              placeholder='支持 HTML 富文本，可直接粘贴排版内容'
              rows={6}
            />

            <div className='grid gap-4 md:grid-cols-2'>
              <form.AppField name='publisherType'>
                {(field) => (
                  <div className='space-y-2'>
                    <Label>发布主体</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => {
                        field.handleChange(v as FormValues['publisherType']);
                        void loadPublishers(v as 'TRAINER' | 'INSTITUTION');
                        form.setFieldValue('publisherId', '');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='TRAINER'>专家</SelectItem>
                        <SelectItem value='INSTITUTION'>机构</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.AppField>

              <form.AppField name='publisherId'>
                {(field) => (
                  <div className='space-y-2'>
                    <Label>选择发布者</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='搜索并选择' />
                      </SelectTrigger>
                      <SelectContent>
                        {publisherOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.AppField>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <FormTextField name='teacherName' label='授课老师' />
              <FormTextField
                name='durationMinutes'
                label='时长（分钟）'
                type='number'
                min={0}
              />
            </div>

            <form.AppField name='isFree'>
              {(field) => (
                <div className='space-y-2'>
                  <Label>是否免费</Label>
                  <RadioGroup
                    value={field.state.value}
                    onValueChange={(v) =>
                      field.handleChange(v as FormValues['isFree'])
                    }
                    className='flex gap-4'
                  >
                    <div className='flex items-center gap-2'>
                      <RadioGroupItem value='0' id='paid' />
                      <Label htmlFor='paid'>付费</Label>
                    </div>
                    <div className='flex items-center gap-2'>
                      <RadioGroupItem value='1' id='free' />
                      <Label htmlFor='free'>免费</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </form.AppField>

            <form.Subscribe selector={(s) => s.values.isFree}>
              {(isFree) =>
                isFree === '0' ? (
                  <div className='grid gap-4 md:grid-cols-3'>
                    <FormTextField name='price' label='售价（元）' type='number' min={0} />
                    <FormTextField
                      name='companyPrice'
                      label='企业封顶价（元）'
                      type='number'
                      min={0}
                    />
                    <FormTextField
                      name='maxPurchaseQty'
                      label='最多购买人数'
                      type='number'
                      min={1}
                    />
                  </div>
                ) : null
              }
            </form.Subscribe>

            <FormTextField
              name='keywords'
              label='关键词'
              placeholder='多个关键词用逗号分隔'
            />

            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.push('/dashboard/videos')}
              >
                取消
              </Button>
              <form.SubmitButton>提交</form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
