'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import * as z from 'zod';
import { Icons } from '@/components/icons';
import { AssetImage } from '@/components/admin/asset-image';
import { RegionCascader } from '@/components/region-cascader';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { uploadImageFile } from '@/features/materials/api/service';
import { getTrainers } from '@/features/trainers/api/service';
import { createTrainerCase } from '../api/service';

const formSchema = z.object({
  trainerUserId: z.string().min(1, '请选择专家'),
  caseTitle: z.string().min(1, '请输入案例标题'),
  enterpriseName: z.string().min(1, '请输入企业名称'),
  industry: z.string().optional(),
  trainingTopic: z.string().optional(),
  trainingEffect: z.string().optional(),
  traineeCount: z.string().optional(),
  trainingAddress: z.string().optional(),
  trainingDate: z.string().optional(),
  description: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

export function CaseCreateForm() {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [trainerOptions, setTrainerOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [coverUrl, setCoverUrl] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const [region, setRegion] = useState<{
    provinceId?: number;
    cityId?: number;
    districtId?: number;
    townId?: number;
  }>({});

  useEffect(() => {
    void getTrainers({ page: 1, limit: 200, status: '2' })
      .then((resp) => {
        const list = resp.data?.list ?? [];
        setTrainerOptions(
          list
            .filter((item) => item.userId)
            .map((item) => ({
              value: String(item.userId),
              label: item.name || `专家 #${item.id}`
            }))
        );
      })
      .catch(() => toast.error('加载专家列表失败'));
  }, []);

  const mutation = useMutation({
    mutationFn: ({
      trainerUserId,
      payload
    }: {
      trainerUserId: number;
      payload: Parameters<typeof createTrainerCase>[1];
    }) => createTrainerCase(trainerUserId, payload),
    onSuccess: (resp) => {
      toast.success('案例已创建');
      const id = resp.data?.id;
      router.push(id ? `/dashboard/trainers/cases/${id}` : '/dashboard/trainers/cases');
    },
    onError: (err: Error) => toast.error(err.message || '创建失败')
  });

  const form = useAppForm({
    defaultValues: {
      trainerUserId: '',
      caseTitle: '',
      enterpriseName: '',
      industry: '',
      trainingTopic: '',
      trainingEffect: '',
      traineeCount: '',
      trainingAddress: '',
      trainingDate: '',
      description: ''
    } as FormValues,
    validators: {
      onSubmit: ({ value }) => {
        const parsed = formSchema.safeParse(value);
        if (!parsed.success) return parsed.error;
        if (!region.provinceId || !region.cityId || !region.districtId) {
          return '请选择完整的培训地点（省/市/区）';
        }
      }
    },
    onSubmit: async ({ value }) => {
      if (!coverUrl.trim()) {
        toast.error('请上传封面图');
        return;
      }
      await mutation.mutateAsync({
        trainerUserId: Number(value.trainerUserId),
        payload: {
          caseTitle: value.caseTitle,
          enterpriseName: value.enterpriseName,
          industry: value.industry || undefined,
          trainingTopic: value.trainingTopic || undefined,
          trainingEffect: value.trainingEffect || undefined,
          traineeCount: value.traineeCount ? Number(value.traineeCount) : undefined,
          provinceId: region.provinceId!,
          cityId: region.cityId!,
          districtId: region.districtId!,
          // 业务仅保存到区，不再采集街道
          townId: undefined,
          trainingAddress: value.trainingAddress || undefined,
          trainingDate: value.trainingDate || undefined,
          description: value.description || undefined,
          coverImage: coverUrl
        }
      });
    }
  });

  const { FormTextField, FormTextareaField } = useFormFields<FormValues>();

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }
    setCoverUploading(true);
    try {
      const url = await uploadImageFile(file);
      setCoverUrl(url);
      toast.success('封面上传成功');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '封面上传失败');
    } finally {
      setCoverUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>添加案例</CardTitle>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='max-w-2xl space-y-4'>
            <form.AppField name='trainerUserId'>
              {(field) => (
                <div className='space-y-2'>
                  <Label>所属专家 *</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) => field.handleChange(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='选择专家' />
                    </SelectTrigger>
                    <SelectContent>
                      {trainerOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.AppField>

            <FormTextField name='caseTitle' label='案例标题' required />
            <FormTextField name='enterpriseName' label='企业名称' required />
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormTextField name='industry' label='行业' />
              <FormTextField name='trainingTopic' label='培训主题' />
            </div>

            <div className='space-y-2'>
              <Label>培训地点 *</Label>
              <RegionCascader
                requireDistrict
                maxLevel={3}
                value={region}
                onChange={setRegion}
              />
            </div>

            <FormTextField name='trainingAddress' label='详细地址' />
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormTextField name='trainingDate' label='培训日期' placeholder='年 / 月 / 日' />
              <FormTextField name='traineeCount' label='受训人数' />
            </div>
            <FormTextareaField name='trainingEffect' label='培训效果' rows={3} />
            <FormTextareaField name='description' label='描述' rows={4} />

            <div className='space-y-2'>
              <Label>封面 *</Label>
              <div className='flex items-start gap-3'>
                <div className='relative h-[100px] w-[160px] overflow-hidden rounded border border-dashed border-muted-foreground/30 bg-muted/30'>
                  <AssetImage
                    src={coverUrl}
                    alt='案例封面'
                    fill
                    wrapperClassName='h-full w-full'
                    className='object-cover'
                    fallback={
                      <div className='flex h-full w-full items-center justify-center text-muted-foreground text-xs'>
                        暂无封面
                      </div>
                    }
                  />
                </div>
                <div className='flex flex-1 flex-col gap-2'>
                  <Input
                    placeholder='封面 URL'
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value.trim())}
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={coverUploading}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    {coverUploading ? (
                      <Icons.spinner className='mr-1 size-4 animate-spin' />
                    ) : (
                      <Icons.upload className='mr-1 size-4' />
                    )}
                    上传封面
                  </Button>
                </div>
                <input
                  ref={coverInputRef}
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={(e) => void handleCoverChange(e)}
                />
              </div>
            </div>

            <div className='flex gap-2'>
              <Button type='submit' isLoading={mutation.isPending}>
                提交
              </Button>
              <Button type='button' variant='outline' onClick={() => router.back()}>
                取消
              </Button>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
