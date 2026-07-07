'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import * as z from 'zod';
import { Icons } from '@/components/icons';
import { RegionCascader } from '@/components/region-cascader';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { getCategoryTree } from '@/features/categories/api/service';
import type { CategoryNode } from '@/features/categories/api/types';
import { AssetImage } from '@/components/admin/asset-image';
import { uploadAvatarFile } from '@/features/materials/api/service';
import {
  filterStandardTrainerExpertiseTree,
  getTrainerIndustryL1Options
} from '@/lib/trainer-expertise-categories';
import { createTrainerApplication } from '../api/service';

const formSchema = z.object({
  phone: z.string().regex(/^1\d{10}$/, '请输入正确的手机号'),
  nickname: z.string().min(1, '请输入昵称'),
  name: z.string().min(1, '请输入真实姓名'),
  teachingName: z.string().min(1, '请输入授课姓名'),
  gender: z.string().min(1, '请选择性别'),
  profilePhone: z.string().min(1, '请输入联系电话'),
  email: z.string().email('请输入有效邮箱'),
  idCardNo: z.string().min(18, '请输入18位身份证号'),
  oneLineIntro: z.string().min(1, '请填写一句话介绍'),
  bio: z.string().min(1, '请输入个人简介'),
  taokePrice: z.string().min(1, '请填写淘课网售价'),
  taokeCommission: z.string().min(1, '请填写淘课网合作课酬'),
  agreementSigned: z.boolean()
});

type FormValues = z.infer<typeof formSchema>;

function flattenTopLevel(nodes: CategoryNode[]) {
  return nodes.map((node) => ({ id: node.id, name: node.name }));
}

export function TrainerCreateForm() {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [industryOptions, setIndustryOptions] = useState<{ id: number; name: string }[]>(
    []
  );
  const [expertiseOptions, setExpertiseOptions] = useState<{ id: number; name: string }[]>(
    []
  );
  const [industryCategoryIds, setIndustryCategoryIds] = useState<number[]>([]);
  const [expertiseCategoryIds, setExpertiseCategoryIds] = useState<number[]>([]);
  const [region, setRegion] = useState<{
    provinceId?: number;
    cityId?: number;
    districtId?: number;
    townId?: number;
  }>({});

  useEffect(() => {
    void Promise.all([
      getCategoryTree('TRAINER_INDUSTRY'),
      getCategoryTree('TRAINER_EXPERTISE')
    ])
      .then(([industryResp, expertiseResp]) => {
        setIndustryOptions(getTrainerIndustryL1Options(industryResp.data ?? []));
        setExpertiseOptions(
          flattenTopLevel(filterStandardTrainerExpertiseTree(expertiseResp.data ?? []))
        );
      })
      .catch(() => toast.error('加载分类失败'));
  }, []);

  const mutation = useMutation({
    mutationFn: createTrainerApplication,
    onSuccess: (resp) => {
      toast.success('专家已创建');
      const trainerId = resp.data?.trainerId;
      router.push(trainerId ? `/dashboard/trainers/${trainerId}` : '/dashboard/trainers');
    },
    onError: (err: Error) => toast.error(err.message || '创建失败')
  });

  const form = useAppForm({
    defaultValues: {
      phone: '',
      nickname: '',
      name: '',
      teachingName: '',
      gender: '',
      profilePhone: '',
      email: '',
      idCardNo: '',
      oneLineIntro: '',
      bio: '',
      taokePrice: '',
      taokeCommission: '',
      agreementSigned: true
    } as FormValues,
    validators: {
      onSubmit: ({ value }) => {
        const parsed = formSchema.safeParse(value);
        if (!parsed.success) return parsed.error;
        if (!avatarUrl) return '请上传专家头像';
        if (!region.provinceId || !region.cityId) return '请选择省份和城市';
        if (industryCategoryIds.length === 0) return '请至少选择一个擅长行业';
        if (expertiseCategoryIds.length === 0) return '请至少选择一个擅长领域';
        if (!value.agreementSigned) return '请勾选专家合作协议';
      }
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        phone: value.phone,
        nickname: value.nickname,
        autoApprove: true,
        profile: {
          name: value.name,
          teachingName: value.teachingName,
          avatar: avatarUrl,
          gender: Number(value.gender),
          phone: value.profilePhone,
          email: value.email,
          idCardNo: value.idCardNo,
          provinceId: region.provinceId!,
          cityId: region.cityId!,
          districtId: region.districtId,
          townId: region.townId,
          oneLineIntro: value.oneLineIntro,
          bio: value.bio,
          industryCategoryIds,
          expertiseCategoryIds,
          taokePrice: Number(value.taokePrice),
          taokeCommission: Number(value.taokeCommission),
          agreementSigned: true,
          agreementVersion: 'v1'
        }
      });
    }
  });

  const { FormTextField, FormTextareaField } = useFormFields<FormValues>();

  const toggleCategory = (
    id: number,
    selected: number[],
    setter: (next: number[]) => void
  ) => {
    setter(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }
    setAvatarUploading(true);
    try {
      const url = await uploadAvatarFile(file);
      setAvatarUrl(url);
      toast.success('头像上传成功');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '头像上传失败');
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>添加专家</CardTitle>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='max-w-2xl space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormTextField name='phone' label='登录手机号' required />
              <FormTextField name='nickname' label='用户昵称' required />
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <FormTextField name='name' label='真实姓名' required />
              <FormTextField name='teachingName' label='授课姓名' required />
            </div>

            <form.AppField name='gender'>
              {(field) => (
                <div className='space-y-2'>
                  <Label>性别 *</Label>
                  <Select value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder='选择性别' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='1'>男</SelectItem>
                      <SelectItem value='2'>女</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.AppField>

            <div className='space-y-2'>
              <Label>头像 *</Label>
              <div className='flex items-start gap-3'>
                <div className='relative size-20 overflow-hidden rounded-full border border-dashed border-muted-foreground/30 bg-muted/30'>
                  <AssetImage
                    src={avatarUrl}
                    alt='专家头像'
                    fill
                    wrapperClassName='h-full w-full rounded-full'
                    className='object-cover'
                    fallback={
                      <div className='flex h-full w-full items-center justify-center text-muted-foreground text-xs'>
                        暂无头像
                      </div>
                    }
                  />
                </div>
                <div className='flex flex-1 flex-col gap-2'>
                  <Input
                    placeholder='头像 URL'
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value.trim())}
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={avatarUploading}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {avatarUploading ? (
                      <Icons.spinner className='mr-1 size-4 animate-spin' />
                    ) : (
                      <Icons.upload className='mr-1 size-4' />
                    )}
                    上传头像
                  </Button>
                </div>
                <input
                  ref={avatarInputRef}
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={(e) => void handleAvatarChange(e)}
                />
              </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <FormTextField name='profilePhone' label='联系电话' required />
              <FormTextField name='email' label='常用邮箱' required />
            </div>
            <FormTextField name='idCardNo' label='身份证号' required />

            <div className='space-y-2'>
              <Label>所在地区 *</Label>
              <RegionCascader value={region} onChange={setRegion} maxLevel={3} />
            </div>

            <FormTextField name='oneLineIntro' label='一句话介绍' required />
            <FormTextareaField name='bio' label='个人简介' rows={4} required />

            <div className='space-y-2'>
              <Label>擅长行业 *</Label>
              <div className='flex flex-wrap gap-3'>
                {industryOptions.map((item) => (
                  <label key={item.id} className='flex items-center gap-2 text-sm'>
                    <Checkbox
                      checked={industryCategoryIds.includes(item.id)}
                      onCheckedChange={() =>
                        toggleCategory(item.id, industryCategoryIds, setIndustryCategoryIds)
                      }
                    />
                    {item.name}
                  </label>
                ))}
              </div>
            </div>

            <div className='space-y-2'>
              <Label>擅长领域 *</Label>
              <div className='flex flex-wrap gap-3'>
                {expertiseOptions.map((item) => (
                  <label key={item.id} className='flex items-center gap-2 text-sm'>
                    <Checkbox
                      checked={expertiseCategoryIds.includes(item.id)}
                      onCheckedChange={() =>
                        toggleCategory(item.id, expertiseCategoryIds, setExpertiseCategoryIds)
                      }
                    />
                    {item.name}
                  </label>
                ))}
              </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <FormTextField name='taokePrice' label='淘课网售价（元/天）' required />
              <FormTextField name='taokeCommission' label='淘课网合作课酬（元/天）' required />
            </div>

            <form.AppField name='agreementSigned'>
              {(field) => (
                <label className='flex items-start gap-2 text-sm'>
                  <Checkbox
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked === true)}
                  />
                  已阅读并同意《淘课网注册专家合作协议》
                </label>
              )}
            </form.AppField>

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
