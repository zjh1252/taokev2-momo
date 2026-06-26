'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import * as z from 'zod';
import { createUser } from '../api/service';
import { userKeys } from '../api/queries';

const userFormSchema = z.object({
  phone: z.string().min(11, '请输入正确的手机号'),
  nickname: z.string().min(1, '请输入昵称'),
  realName: z.string().optional()
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserFormSheet({ open, onOpenChange }: UserFormSheetProps) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success('用户创建成功');
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
      onOpenChange(false);
      form.reset();
    },
    onError: (err: Error) => toast.error(err.message || '创建失败')
  });

  const form = useAppForm({
    defaultValues: {
      phone: '',
      nickname: '',
      realName: ''
    } as UserFormValues,
    validators: {
      onSubmit: userFormSchema
    },
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync({
        phone: value.phone,
        nickname: value.nickname,
        realName: value.realName || undefined
      });
    }
  });

  const { FormTextField } = useFormFields<UserFormValues>();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>新建用户</SheetTitle>
          <SheetDescription>填写用户信息完成创建</SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='user-form-sheet' className='space-y-4'>
              <FormTextField
                name='phone'
                label='手机号'
                required
                placeholder='13800000000'
                validators={{
                  onBlur: z.string().min(11, '请输入正确的手机号')
                }}
              />
              <FormTextField
                name='nickname'
                label='昵称'
                required
                placeholder='请输入昵称'
                validators={{
                  onBlur: z.string().min(1, '请输入昵称')
                }}
              />
              <FormTextField
                name='realName'
                label='真实姓名'
                placeholder='可选'
              />
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type='submit'
            form='user-form-sheet'
            isLoading={createMutation.isPending}
          >
            <Icons.check /> 创建用户
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function UserFormSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' /> 新建用户
      </Button>
      <UserFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
