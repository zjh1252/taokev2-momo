'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { loginMutation } from '@/features/auth/api/mutations';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const { mutate, isPending } = useMutation({
    ...loginMutation,
    onSuccess: (result) => {
      if (result.code !== 0) {
        toast.error(result.message || '登录失败');
        return;
      }
      toast.success('登录成功');
      router.replace('/dashboard');
    },
    onError: () => {
      toast.error('网络错误，请稍后重试');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !password.trim()) {
      toast.error('请填写手机号和密码');
      return;
    }
    mutate({ phone: phone.trim(), password });
  };

  return (
    <Card>
      <CardHeader className='text-center'>
        <CardTitle className='text-2xl'>登录</CardTitle>
        <CardDescription>使用手机号和密码登录管理后台</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='phone'>手机号</Label>
            <Input
              id='phone'
              type='tel'
              placeholder='请输入手机号'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={11}
              autoComplete='tel'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='password'>密码</Label>
            <Input
              id='password'
              type='password'
              placeholder='请输入密码'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete='current-password'
            />
          </div>
        </CardContent>
        <CardFooter className='flex flex-col gap-3'>
          <Button type='submit' className='w-full' isLoading={isPending}>
            登录
          </Button>
          <p className='text-muted-foreground text-sm'>
            还没有账号？{' '}
            <Link href='/register' className='text-primary hover:underline'>
              立即注册
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
