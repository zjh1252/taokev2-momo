'use client';

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
import { COURSE_TYPE_OPTIONS } from '../api/types';

const formSchema = z.object({
  title: z.string().min(1, '请输入课程名称'),
  type: z.enum(['INTERNAL', 'OPEN_OFFLINE', 'OPEN_ONLINE']),
  coverUrl: z.string().min(1, '请上传课程封面')
});

type FormValues = z.infer<typeof formSchema>;

/**
 * 课程创建占位表单 — 后台运营创建课程 API 待对接。
 */
export function CourseCreateForm() {
  const router = useRouter();

  const form = useAppForm({
    defaultValues: {
      title: '',
      type: 'OPEN_OFFLINE' as FormValues['type'],
      coverUrl: ''
    },
    validators: {
      onSubmit: formSchema
    },
    onSubmit: async ({ value }) => {
      toast.info(`课程创建功能开发中：${value.title}`);
    }
  });

  const { FormTextField } = useFormFields<FormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>添加课程</CardTitle>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='space-y-4 max-w-xl'>
            <FormTextField name='title' label='课程名称' required />
            <FormTextField
              name='coverUrl'
              label='封面图 URL'
              required
              placeholder='粘贴封面图地址'
            />
            <form.AppField name='type'>
              {(field) => (
                <div className='space-y-2'>
                  <Label>课程类型</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) =>
                      field.handleChange(v as FormValues['type'])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COURSE_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.AppField>
            <p className='text-muted-foreground text-sm'>
              完整课程创建（发布主体、分类、排课等）将在后台创建 API 就绪后接入。
            </p>
            <div className='flex gap-2'>
              <Button type='submit'>保存（占位）</Button>
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
