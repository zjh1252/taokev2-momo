'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
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
import { createBook } from '../api/service';
import { getTrainers } from '@/features/trainers/api/service';

const formSchema = z.object({
  trainerId: z.string().min(1, '请选择专家'),
  title: z.string().min(1, '请输入书名'),
  authorName: z.string().optional(),
  coverUrl: z.string().optional(),
  publisher: z.string().optional(),
  publishDate: z.string().optional(),
  description: z.string().optional(),
  buyUrl: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

export function BookCreateForm() {
  const router = useRouter();
  const [trainerOptions, setTrainerOptions] = useState<
    { value: string; label: string }[]
  >([]);

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
      coverUrl: '',
      publisher: '',
      publishDate: '',
      description: '',
      buyUrl: ''
    } as FormValues,
    validators: {
      onSubmit: formSchema
    },
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync({
        trainerId: Number(value.trainerId),
        title: value.title,
        authorName: value.authorName || undefined,
        coverUrl: value.coverUrl || undefined,
        publisher: value.publisher || undefined,
        publishDate: value.publishDate || undefined,
        description: value.description || undefined,
        buyUrl: value.buyUrl || undefined
      });
    }
  });

  const { FormTextField, FormTextareaField } = useFormFields<FormValues>();

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
            <FormTextField name='coverUrl' label='封面 URL' />
            <FormTextField name='publisher' label='出版社' />
            <FormTextField name='publishDate' label='出版日期' placeholder='YYYY-MM-DD' />
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
