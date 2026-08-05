'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import * as z from 'zod';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { createBook } from '../api/service';
import { getTrainers } from '@/features/trainers/api/service';
import { AssetImage } from '@/components/admin/asset-image';
import { uploadImageFile } from '@/features/materials/api/service';

const formSchema = z.object({
  trainerId: z.string().min(1, '请选择专家'),
  title: z.string().min(1, '请输入书名'),
  authorName: z.string().optional(),
  publisher: z.string().optional(),
  publishDate: z.string().optional(),
  description: z.string().optional(),
  buyUrl: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

export function BookCreateForm() {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [trainerOptions, setTrainerOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [coverUrl, setCoverUrl] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);

  useEffect(() => {
    void getTrainers({ page: 1, limit: 100, status: '2' })
      .then((resp) => {
        const list = resp.data?.list ?? [];
        setTrainerOptions(
          list.map((t) => ({
            value: String(t.id),
            label: t.name || `专家 #${t.id}`
          }))
        );
      })
      .catch(() => toast.error('加载专家列表失败'));
  }, []);

  const createMutation = useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      toast.success('著作已提交');
      router.push('/dashboard/books/list');
    },
    onError: (err: Error) => toast.error(err.message || '创建失败')
  });

  const form = useAppForm({
    defaultValues: {
      trainerId: '',
      title: '',
      authorName: '',
      publisher: '',
      publishDate: '',
      description: '',
      buyUrl: ''
    } as FormValues,
    validators: {
      onSubmit: formSchema
    },
    onSubmit: async ({ value }) => {
      if (!coverUrl.trim()) {
        toast.error('请上传封面图');
        return;
      }
      await createMutation.mutateAsync({
        trainerId: Number(value.trainerId),
        title: value.title,
        authorName: value.authorName || undefined,
        coverUrl: coverUrl,
        publisher: value.publisher || undefined,
        publishDate: value.publishDate || undefined,
        description: value.description || undefined,
        buyUrl: value.buyUrl || undefined
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
        <CardTitle>添加著作</CardTitle>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='space-y-4 max-w-xl'>
            <form.AppField name='trainerId'>
              {(field) => (
                <div className='space-y-2'>
                  <Label>所属专家</Label>
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
            <FormTextField name='title' label='书名' required />
            <FormTextField name='authorName' label='作者名' />
            <div className='space-y-2'>
              <Label>封面 *</Label>
              <div className='flex items-start gap-3'>
                <div className='relative h-[100px] w-[72px] overflow-hidden rounded border border-dashed border-muted-foreground/30 bg-muted/30'>
                  <AssetImage
                    src={coverUrl}
                    alt='著作封面'
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
                    placeholder='封面 URL（可直接粘贴图片地址）'
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value.trim())}
                  />
                  <div className='flex flex-wrap gap-2'>
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
                    {coverUrl ? (
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => setCoverUrl('')}
                      >
                        清除
                      </Button>
                    ) : null}
                  </div>
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
            <FormTextField name='publisher' label='出版社' />
            <FormTextField name='publishDate' label='出版日期' placeholder='年 / 月 / 日' />
            <FormTextareaField name='description' label='简介' rows={4} />
            <FormTextField name='buyUrl' label='购买链接' />
            <div className='flex gap-2'>
              <Button
                type='submit'
                isLoading={createMutation.isPending}
              >
                提交
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.back()}
              >
                取消
              </Button>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
