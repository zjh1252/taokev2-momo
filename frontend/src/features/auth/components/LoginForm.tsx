'use client';

import { useState, useCallback, useEffect, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowRight, MessageCircle, Fingerprint, Loader2, Bug, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { storage } from '@/lib/storage';
import { useAuth } from '@/lib/auth/auth-context';
import { TOKEN_KEY } from '@/lib/auth/constants';
import { sendCode, smsLogin, getMockCode } from '../api/service';
import { RoleSelectModal } from '@/features/role-apply/components/RoleSelectModal';

const PHONE_LENGTH = 11;
const CODE_LENGTH = 6;
const COUNTDOWN_SECONDS = 60;
const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * 登录/注册表单 — 短信验证码登录，未注册自动创建账号
 *
 * @author Fangxinxin
 * @date 2026-04-01 17:30
 */
export function LoginForm() {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState('');
  const [devCopied, setDevCopied] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const canSendCode = phone.length === PHONE_LENGTH && countdown === 0 && !sendingCode;
  const canSubmit =
    phone.length === PHONE_LENGTH &&
    code.length === CODE_LENGTH &&
    agreed &&
    !submitting;

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = useCallback(async () => {
    if (!canSendCode) return;
    setError('');
    setSendingCode(true);
    try {
      await sendCode(phone);
      setCountdown(COUNTDOWN_SECONDS);

      // 开发环境：获取 Mock 验证码并弹窗提示
      if (IS_DEV) {
        try {
          const res = await getMockCode(phone);
          if (res.data) {
            setCode(res.data);
            setDevCode(res.data);
            setDevCopied(false);
          }
        } catch {
          // Mock 接口失败不影响正常流程
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送验证码失败');
    } finally {
      setSendingCode(false);
    }
  }, [canSendCode, phone]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await smsLogin(phone, code);
      const token = res.data;
      storage.set(TOKEN_KEY, {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        expiresIn: token.expiresIn,
        tokenType: token.tokenType,
      });
      await refreshUser();

      const isNewUser = token.newUser === true;
      const dismissed = !!storage.get<boolean>('taoke_role_apply_dismissed');
      if (isNewUser && !dismissed) {
        setShowRoleModal(true);
      } else {
        router.push('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-10">
        <h2 className="font-heading font-bold text-2xl mb-2">{t('title')}</h2>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

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
              {countdown > 0
                ? t('codeSent', { seconds: countdown })
                : t('getCode')}
            </button>
          </div>
        </div>

        {/* 用户协议 */}
        <div className="flex items-start gap-3 py-2">
          <div className="mt-1 flex items-center">
            <input
              id="agreement"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="size-4 rounded border-border text-primary focus:ring-primary/20 focus:ring-offset-0 transition-all"
            />
          </div>
          <label
            htmlFor="agreement"
            className="text-xs text-muted-foreground leading-relaxed"
          >
            {t('agreement')}
            <a href="#" className="text-primary font-semibold hover:underline">
              {t('termsLink')}
            </a>
            {t('and')}
            <a href="#" className="text-primary font-semibold hover:underline">
              {t('privacyLink')}
            </a>
          </label>
        </div>

        {/* 提交按钮 */}
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

      {/* 社交登录 */}
      <div className="mt-12">
        <div className="relative flex items-center justify-center mb-8">
          <div className="flex-grow border-t border-border/50" />
          <span className="flex-shrink mx-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            {t('socialDivider')}
          </span>
          <div className="flex-grow border-t border-border/50" />
        </div>
        <div className="flex justify-center gap-6">
          <button
            type="button"
            className="size-12 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
          >
            <MessageCircle className="size-6" />
          </button>
          <button
            type="button"
            className="size-12 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
          >
            <Fingerprint className="size-6" />
          </button>
        </div>
      </div>

      {/* 新用户角色选择弹窗 */}
      <RoleSelectModal
        open={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          router.push('/');
        }}
      />

      {/* DEV 环境调试弹窗 — 显示 Mock 验证码 */}
      {IS_DEV && devCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="relative w-80 rounded-2xl bg-white shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-amber-100">
              <Bug className="size-5 text-amber-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">开发环境调试</h3>
            <p className="text-sm text-gray-500 mb-4">
              你正处于测试环境，请使用以下验证码登录：
            </p>
            <div className="flex items-center justify-center gap-2 mb-5">
              <span className="font-mono text-3xl font-extrabold tracking-[0.3em] text-primary">
                {devCode}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(devCode);
                  setDevCopied(true);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="复制验证码"
              >
                {devCopied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">验证码已自动填入输入框</p>
            <button
              type="button"
              onClick={() => setDevCode('')}
              className="w-full h-10 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </>
  );
}
