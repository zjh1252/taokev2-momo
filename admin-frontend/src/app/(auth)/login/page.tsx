'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginMutation } from '@/features/auth/api/mutations';
import { useAuthOwl } from '../auth-owl-context';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const { setFocusTarget } = useAuthOwl();

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
    <div>
      <div className='mb-8'>
        <h2 className='text-2xl font-bold tracking-tight'>登录</h2>
        <p className='text-muted-foreground mt-1 text-sm'>
          使用手机号和密码登录管理后台
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-5'>
        <div className='space-y-2'>
          <Label htmlFor='phone'>手机号</Label>
          <Input
            id='phone'
            type='tel'
            placeholder='请输入手机号'
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onFocus={() => setFocusTarget('phone')}
            onBlur={() => setFocusTarget('none')}
            maxLength={11}
            autoComplete='tel'
            className='h-11 focus-visible:ring-primary/30'
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
            onFocus={() => setFocusTarget('password')}
            onBlur={() => setFocusTarget('none')}
            autoComplete='current-password'
            className='h-11 focus-visible:ring-primary/30'
          />
        </div>

        <Button type='submit' className='h-11 w-full text-base' isLoading={isPending}>
          登录
        </Button>
      </form>

      <p className='text-muted-foreground mt-6 text-center text-sm'>
        还没有账号？{' '}
        <Link href='/register' className='text-primary font-medium hover:underline'>
          立即注册
        </Link>
      </p>
    </div>
  );
}
