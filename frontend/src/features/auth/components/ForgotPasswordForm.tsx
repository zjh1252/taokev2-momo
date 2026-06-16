'use client';

import { useState, useCallback, useEffect, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { ArrowRight, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { sendCode, resetPassword, getMockCode } from '../api/service';
import { withCaptcha } from '@/lib/captcha';

const PHONE_LENGTH = 11;
const CODE_LENGTH = 6;
const COUNTDOWN_SECONDS = 60;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 32;
const IS_MOCK_SMS = process.env.NEXT_PUBLIC_MOCK_SMS === 'true'
  || (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_MOCK_SMS !== 'false');

/**
 * 忘记密码表单 — 手机号 + 短信验证码 重置登录密码
 *
 * @author Fangxinxin
 * @date 2026-06-11 16:00
 */
export function ForgotPasswordForm() {
  const t = useTranslations('auth.forgot');
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSendCode = phone.length === PHONE_LENGTH && countdown === 0 && !sendingCode;
  const canSubmit =
    phone.length === PHONE_LENGTH &&
    code.length === CODE_LENGTH &&
    newPassword.length >= PASSWORD_MIN &&
    newPassword.length <= PASSWORD_MAX &&
    confirmPassword.length > 0 &&
    !submitting;

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = useCallback(async () => {
    if (!canSendCode) return;
    setSendingCode(true);
    try {
      await withCaptcha((token, silent) =>
        sendCode(phone, 'RESET_PASSWORD', token, { silent }),
      );
      setCountdown(COUNTDOWN_SECONDS);
      if (IS_MOCK_SMS) {
        try {
          const res = await getMockCode(phone);
          if (res.data) setCode(res.data);
        } catch {
          // Mock 接口失败不影响正常流程
        }
      }
    } catch {
      // 错误已由全局 toast 统一提示
    } finally {
      setSendingCode(false);
    }
  }, [canSendCode, phone]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (newPassword !== confirmPassword) {
      toast.error(t('passwordMismatch'));
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(phone, code, newPassword);
      toast.success(t('success'));
      router.push(ROUTES.LOGIN);
    } catch {
      // 错误已由全局 toast 统一提示
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="font-heading font-bold text-2xl mb-2">{t('title')}</h2>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 手机号 */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted-foreground tracking-widest uppercase">
            {t('phoneLabel')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pr-3 border-r border-border/30">
              <span className="text-foreground font-medium text-sm">+86</span>
            </div>
            <input
              type="tel"
              maxLength={PHONE_LENGTH}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder={t('phonePlaceholder')}
              className="w-full h-12 pl-16 pr-4 bg-muted/50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-foreground text-base placeholder:text-muted-foreground/50 transition-all outline-none"
            />
          </div>
        </div>

        {/* 验证码 */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted-foreground tracking-widest uppercase">
            {t('codeLabel')}
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              maxLength={CODE_LENGTH}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder={t('codePlaceholder')}
              className="flex-1 h-12 px-4 bg-muted/50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-foreground text-base placeholder:text-muted-foreground/50 transition-all outline-none"
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={!canSendCode}
              className={cn(
                'h-12 px-6 whitespace-nowrap font-bold text-sm rounded-xl transition-colors flex items-center gap-2',
                canSendCode
                  ? 'text-primary hover:bg-primary/5 cursor-pointer'
                  : 'text-muted-foreground cursor-not-allowed',
              )}
            >
              {sendingCode && <Loader2 className="size-4 animate-spin" />}
              {countdown > 0 ? t('codeSent', { seconds: countdown }) : t('getCode')}
            </button>
          </div>
        </div>

        {/* 新密码 */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted-foreground tracking-widest uppercase">
            {t('newPasswordLabel')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4">
              <Lock className="size-4 text-muted-foreground/60" />
            </div>
            <input
              type="password"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('newPasswordPlaceholder')}
              className="w-full h-12 pl-11 pr-4 bg-muted/50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-foreground text-base placeholder:text-muted-foreground/50 transition-all outline-none"
            />
          </div>
        </div>

        {/* 确认新密码 */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted-foreground tracking-widest uppercase">
            {t('confirmPasswordLabel')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4">
              <Lock className="size-4 text-muted-foreground/60" />
            </div>
            <input
              type="password"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('confirmPasswordPlaceholder')}
              className="w-full h-12 pl-11 pr-4 bg-muted/50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-foreground text-base placeholder:text-muted-foreground/50 transition-all outline-none"
            />
          </div>
        </div>

        {/* 提交 */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            'w-full h-12 bg-gradient-to-r from-[#be0003] to-primary text-white font-heading font-bold text-base rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all',
            canSubmit
              ? 'hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]'
              : 'opacity-60 cursor-not-allowed',
          )}
        >
          {submitting ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <span>{t('submit')}</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <Link href={ROUTES.LOGIN} className="text-primary font-semibold hover:underline">
          {t('backToLogin')}
        </Link>
      </div>
    </>
  );
}
