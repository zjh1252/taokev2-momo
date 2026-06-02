'use client';

import { useState, useCallback, useEffect, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Lock, Loader2, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { storage } from '@/lib/storage';
import { useAuth } from '@/lib/auth/auth-context';
import { TOKEN_KEY } from '@/lib/auth/constants';
import { markNewUserPending } from '@/features/role-apply/hooks/useRoleApplyState';
import { sendCode, register, getMockCode } from '../api/service';
import { withCaptcha } from '@/lib/captcha';

const PHONE_LENGTH = 11;
const CODE_LENGTH = 6;
const COUNTDOWN_SECONDS = 60;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 32;
const PHONE_REGEX = /^1[3-9]\d{9}$/;
// dev 默认开启 mock 验证码自动填充；用真实短信(pxb)联调时可设 NEXT_PUBLIC_MOCK_SMS=false 关闭
const IS_MOCK_SMS = process.env.NEXT_PUBLIC_MOCK_SMS === 'true'
  || (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_MOCK_SMS !== 'false');

/**
 * 注册表单 — 手机号 + 验证码 + 密码（账号即手机号，统一接入 UCenter）
 *
 * @author Fangxinxin
 * @date 2026-05-23 12:00
 */
export function RegisterForm() {
  const t = useTranslations('auth.register');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);

  const phoneValid = PHONE_REGEX.test(phone);
  const passwordValid = password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX;
  const passwordsMatch = password === confirmPassword;
  const canSendCode = phoneValid && countdown === 0 && !sendingCode;
  const canSubmit =
    phoneValid &&
    code.length === CODE_LENGTH &&
    passwordValid &&
    passwordsMatch &&
    agreed &&
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
      // 发码前先过滑块（withCaptcha 在后端要求时自动弹出）
      await withCaptcha((token, silent) => sendCode(phone, 'REGISTER', token, { silent }));
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
    setSubmitting(true);
    try {
      const res = await register({ phone, code, password });
      const token = res.data;
      storage.set(TOKEN_KEY, {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        expiresIn: token.expiresIn,
        tokenType: token.tokenType,
      });
      await refreshUser();
      if (token.newUser === true) {
        markNewUserPending();
      }
      const redirect = searchParams.get('redirect');
      router.push(redirect || '/');
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

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 手机号 */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted-foreground tracking-widest uppercase">
            {t('phoneLabel')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4">
              <Smartphone className="size-4 text-muted-foreground/60" />
            </div>
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              maxLength={PHONE_LENGTH}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder={t('phonePlaceholder')}
              className="w-full h-12 pl-11 pr-4 bg-muted/50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-foreground text-base placeholder:text-muted-foreground/50 transition-all outline-none"
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

        {/* 密码 */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted-foreground tracking-widest uppercase">
            {t('passwordLabel')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4">
              <Lock className="size-4 text-muted-foreground/60" />
            </div>
            <input
              type="password"
              name="new-password"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
              className="w-full h-12 pl-11 pr-4 bg-muted/50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-foreground text-base placeholder:text-muted-foreground/50 transition-all outline-none"
            />
          </div>
          {password.length > 0 && !passwordValid && (
            <p className="text-[11px] mt-1 text-red-500">{t('passwordTooShort')}</p>
          )}
        </div>

        {/* 确认密码 */}
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
              name="confirm-password"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('confirmPasswordPlaceholder')}
              className="w-full h-12 pl-11 pr-4 bg-muted/50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-foreground text-base placeholder:text-muted-foreground/50 transition-all outline-none"
            />
          </div>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-[11px] mt-1 text-red-500">{t('passwordMismatch')}</p>
          )}
        </div>

        {/* 用户协议 */}
        <div className="flex items-start gap-3 py-2">
          <div className="mt-1 flex items-center">
            <input
              id="register-agreement"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="size-4 rounded border-border text-primary focus:ring-primary/20 focus:ring-offset-0 transition-all"
            />
          </div>
          <label htmlFor="register-agreement" className="text-xs text-muted-foreground leading-relaxed">
            {t('agreement')}
            <a href="#" className="text-primary font-semibold hover:underline">{t('termsLink')}</a>
            {t('and')}
            <a href="#" className="text-primary font-semibold hover:underline">{t('privacyLink')}</a>
          </label>
        </div>

        {/* 注册按钮 */}
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

      {/* 已有账号 */}
      <div className="mt-8 text-center">
        <span className="text-sm text-muted-foreground">{t('hasAccount')}</span>
        <Link href={ROUTES.LOGIN} className="text-sm text-primary font-semibold hover:underline ml-1">
          {t('loginLink')}
        </Link>
      </div>
    </>
  );
}
