'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, User, Lock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { storage } from '@/lib/storage';
import { useAuth } from '@/lib/auth/auth-context';
import { TOKEN_KEY } from '@/lib/auth/constants';
import { markNewUserPending } from '@/features/role-apply/hooks/useRoleApplyState';
import { usernameRegister, checkUsernameAvailable } from '../api/service';

const USERNAME_MIN = 4;
const USERNAME_MAX = 32;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 32;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export function RegisterForm() {
  const t = useTranslations('auth.register');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');

  const usernameFormatValid =
    username.length >= USERNAME_MIN &&
    username.length <= USERNAME_MAX &&
    USERNAME_REGEX.test(username);
  const passwordValid = password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX;
  const passwordsMatch = password === confirmPassword;
  const canSubmit =
    usernameFormatValid &&
    usernameStatus !== 'taken' &&
    usernameStatus !== 'invalid' &&
    passwordValid &&
    passwordsMatch &&
    agreed &&
    !submitting;

  const handleUsernameBlur = useCallback(async () => {
    if (!username) {
      setUsernameStatus('idle');
      return;
    }
    if (!usernameFormatValid) {
      setUsernameStatus('invalid');
      return;
    }
    setUsernameStatus('checking');
    try {
      const res = await checkUsernameAvailable(username);
      setUsernameStatus(res.data ? 'available' : 'taken');
    } catch {
      setUsernameStatus('idle');
    }
  }, [username, usernameFormatValid]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await usernameRegister({ username, password });
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
    } catch (err) {
      setError(err instanceof Error ? err.message : t('registerError'));
    } finally {
      setSubmitting(false);
    }
  };

  const usernameHintText = (() => {
    if (usernameStatus === 'taken') return t('usernameTaken');
    if (usernameStatus === 'invalid') return t('usernameInvalid');
    return t('usernameHint');
  })();
  const usernameHintClass = cn(
    'text-[11px] mt-1',
    usernameStatus === 'taken' || usernameStatus === 'invalid'
      ? 'text-red-500'
      : usernameStatus === 'available'
        ? 'text-green-500'
        : 'text-muted-foreground/70',
  );

  return (
    <>
      <div className="mb-8">
        <h2 className="font-heading font-bold text-2xl mb-2">{t('title')}</h2>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 账号 */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted-foreground tracking-widest uppercase">
            {t('usernameLabel')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4">
              <User className="size-4 text-muted-foreground/60" />
            </div>
            <input
              type="text"
              name="username"
              autoComplete="username"
              maxLength={USERNAME_MAX}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.trim());
                setUsernameStatus('idle');
              }}
              onBlur={handleUsernameBlur}
              placeholder={t('usernamePlaceholder')}
              className="w-full h-12 pl-11 pr-4 bg-muted/50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-foreground text-base placeholder:text-muted-foreground/50 transition-all outline-none"
            />
          </div>
          <p className={usernameHintClass}>
            {usernameStatus === 'checking' ? '检查中…' : usernameHintText}
          </p>
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
