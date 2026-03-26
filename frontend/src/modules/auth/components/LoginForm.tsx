'use client';

import { useState, useCallback, useEffect, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, MessageCircle, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';

const PHONE_LENGTH = 11;
const CODE_LENGTH = 6;
const COUNTDOWN_SECONDS = 60;

export function LoginForm() {
  const t = useTranslations('auth.login');

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const canSendCode = phone.length === PHONE_LENGTH && countdown === 0;
  const canSubmit = phone.length === PHONE_LENGTH && code.length === CODE_LENGTH && agreed;

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = useCallback(() => {
    if (!canSendCode) return;
    // TODO: 调用发送验证码接口
    setCountdown(COUNTDOWN_SECONDS);
  }, [canSendCode]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    // TODO: 调用登录/注册接口
  };

  return (
    <>
      <div className="mb-10">
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
                'h-12 px-6 whitespace-nowrap font-bold text-sm rounded-xl transition-colors',
                canSendCode
                  ? 'text-primary hover:bg-primary/5 cursor-pointer'
                  : 'text-muted-foreground cursor-not-allowed',
              )}
            >
              {countdown > 0 ? t('codeSent', { seconds: countdown }) : t('getCode')}
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
          <label htmlFor="agreement" className="text-xs text-muted-foreground leading-relaxed">
            {t('agreement')}
            <a href="#" className="text-primary font-semibold hover:underline">{t('termsLink')}</a>
            {t('and')}
            <a href="#" className="text-primary font-semibold hover:underline">{t('privacyLink')}</a>
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
          <span>{t('submit')}</span>
          <ArrowRight className="size-4" />
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
    </>
  );
}
