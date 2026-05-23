'use client';

// ------------------------------------------------------------
// 后台注册页「已停用」的原始实现保留件。
// 后台不开放自助注册，路由已在 page.tsx 重定向到 /login。
// 如需恢复：把本文件内容搬回 page.tsx 即可。
// ------------------------------------------------------------

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerMutation, sendCodeMutation } from '@/features/auth/api/mutations';
import { useAuthOwl } from '../auth-owl-context';

const COUNTDOWN_SECONDS = 60;

export default function RegisterPageKept() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const { setFocusTarget } = useAuthOwl();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = useCallback(() => {
    setCountdown(COUNTDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const sendCodeMut = useMutation({
    ...sendCodeMutation,
    onSuccess: (result) => {
      if (result.code !== 0) {
        toast.error(result.message || '发送失败');
        return;
      }
      toast.success('验证码已发送');
      startCountdown();
    },
    onError: () => {
      toast.error('发送失败，请稍后重试');
    }
  });

  const registerMut = useMutation({
    ...registerMutation,
    onSuccess: (result) => {
      if (result.code !== 0) {
        toast.error(result.message || '注册失败');
        return;
      }
      toast.success('注册成功');
      router.replace('/dashboard');
    },
    onError: () => {
      toast.error('网络错误，请稍后重试');
    }
  });

  const handleSendCode = () => {
    const trimmedPhone = phone.trim();
    if (!/^1[3-9]\d{9}$/.test(trimmedPhone)) {
      toast.error('请输入正确的手机号');
      return;
    }
    sendCodeMut.mutate({
      target: trimmedPhone,
      type: 'REGISTER',
      sendType: 'SMS'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !code.trim() || !password) {
      toast.error('请填写所有必填项');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('两次密码输入不一致');
      return;
    }
    if (password.length < 6) {
      toast.error('密码至少 6 位');
      return;
    }
    registerMut.mutate({
      phone: phone.trim(),
      code: code.trim(),
      password
    });
  };

  return (
    <div>
      <div className='mb-8'>
        <h2 className='text-2xl font-bold tracking-tight'>注册</h2>
        <p className='text-muted-foreground mt-1 text-sm'>
          创建新账号以使用管理后台
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
          <Label htmlFor='code'>验证码</Label>
          <div className='flex gap-2'>
            <Input
              id='code'
              type='text'
              placeholder='请输入验证码'
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onFocus={() => setFocusTarget('code')}
              onBlur={() => setFocusTarget('none')}
              maxLength={6}
              autoComplete='one-time-code'
              className='h-11 flex-1 focus-visible:ring-primary/30'
            />
            <Button
              type='button'
              variant='outline'
              onClick={handleSendCode}
              disabled={countdown > 0 || sendCodeMut.isPending}
              isLoading={sendCodeMut.isPending}
              className='h-11 shrink-0'
            >
              {countdown > 0 ? `${countdown}s` : '获取验证码'}
            </Button>
          </div>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='password'>密码</Label>
          <Input
            id='password'
            type='password'
            placeholder='至少 6 位'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocusTarget('password')}
            onBlur={() => setFocusTarget('none')}
            autoComplete='new-password'
            className='h-11 focus-visible:ring-primary/30'
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='confirmPassword'>确认密码</Label>
          <Input
            id='confirmPassword'
            type='password'
            placeholder='再次输入密码'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onFocus={() => setFocusTarget('confirm')}
            onBlur={() => setFocusTarget('none')}
            autoComplete='new-password'
            className='h-11 focus-visible:ring-primary/30'
          />
        </div>

        <Button
          type='submit'
          className='h-11 w-full text-base'
          isLoading={registerMut.isPending}
        >
          注册
        </Button>
      </form>

      <p className='text-muted-foreground mt-6 text-center text-sm'>
        已有账号？{' '}
        <Link href='/login' className='text-primary font-medium hover:underline'>
          去登录
        </Link>
      </p>
    </div>
  );
}
