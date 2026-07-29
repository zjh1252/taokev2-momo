'use client';

import { useState, useCallback, useEffect, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Loader2, Bug, Copy, Check, User, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { storage } from '@/lib/storage';
import { useAuth } from '@/lib/auth/auth-context';
import { TOKEN_KEY } from '@/lib/auth/constants';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { sendCode, smsLogin, getMockCode, usernameLogin } from '../api/service';
import { withCaptcha, verifyCaptcha, CAPTCHA_REQUIRED_CODE } from '@/lib/captcha';
import { ApiException } from '@/lib/http/client';
import { showError } from '@/lib/toast';
import { markNewUserPending } from '@/features/role-apply/hooks/useRoleApplyState';
import { LEGAL_PRIVACY_PATH, LEGAL_TERMS_PATH } from '../constants/legal';

/** 密码错误业务码（ErrorCode.PASSWORD_INCORRECT） */
const PASSWORD_INCORRECT_CODE = '10006';

const PHONE_LENGTH = 11;
const CODE_LENGTH = 6;
const COUNTDOWN_SECONDS = 60;
const USERNAME_MIN = 4;
const USERNAME_MAX = 32;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 32;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
// dev 默认开启 mock 验证码自动填充；用真实短信(pxb)联调时可设 NEXT_PUBLIC_MOCK_SMS=false 关闭
const IS_MOCK_SMS = process.env.NEXT_PUBLIC_MOCK_SMS === 'true'
  || (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_MOCK_SMS !== 'false');

type TabKey = 'sms' | 'username';

/**
 * 登录/注册表单 — 支持短信验证码 与 账号密码 两种登录方式
 *
 * @author Fangxinxin
 * @date 2026-04-24 10:00
 */
export function LoginForm() {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  const [tab, setTab] = useState<TabKey>('sms');

  // ---- 短信登录字段 ----
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [devCopied, setDevCopied] = useState(false);

  // ---- 账号密码登录字段 ----
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // ---- 公共 ----
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // 账号密码登录：密码错 1 次后置 true，之后登录「先过滑块再请求」
  const [pwdCaptchaRequired, setPwdCaptchaRequired] = useState(false);

  const canSendCode = phone.length === PHONE_LENGTH && countdown === 0 && !sendingCode;
  const canSubmitSms =
    phone.length === PHONE_LENGTH &&
    code.length === CODE_LENGTH &&
    agreed &&
    !submitting;
  const canSubmitUsername =
    USERNAME_REGEX.test(username) &&
    username.length >= USERNAME_MIN &&
    username.length <= USERNAME_MAX &&
    password.length >= PASSWORD_MIN &&
    password.length <= PASSWORD_MAX &&
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
      // 开启卡点时：发码前先过滑块（withCaptcha 自动按需弹出）
      await withCaptcha((token, silent) => sendCode(phone, 'LOGIN', token, { silent }));
      setCountdown(COUNTDOWN_SECONDS);

      if (IS_MOCK_SMS) {
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
    } catch {
      // 错误已由全局 toast 统一提示
    } finally {
      setSendingCode(false);
    }
  }, [canSendCode, phone]);

  const finishLogin = useCallback(
    async (token: { accessToken: string; refreshToken: string; expiresIn: number; tokenType: string; newUser?: boolean }) => {
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
    },
    [refreshUser, router, searchParams],
  );

  const handleSmsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmitSms) return;
    setSubmitting(true);
    try {
      const res = await smsLogin(phone, code);
      await finishLogin(res.data);
    } catch {
      // 错误已由全局 toast 统一提示
    } finally {
      setSubmitting(false);
    }
  };

  const handleUsernameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmitUsername) return;
    setSubmitting(true);
    try {
      // 已知需要滑块（上次密码错/后端要求）→ 先弹滑块拿 token，再请求登录
      let token: string | undefined;
      if (pwdCaptchaRequired) {
        token = await verifyCaptcha();
      }
      const res = await usernameLogin({ username, password, captchaToken: token }, { silent: true });
      await finishLogin(res.data);
    } catch (e) {
      if (e instanceof ApiException) {
        // 密码错 / 后端要求滑块 → 标记，下次提交先弹滑块
        if (e.code === PASSWORD_INCORRECT_CODE || e.code === CAPTCHA_REQUIRED_CODE) {
          setPwdCaptchaRequired(true);
        }
        // CAPTCHA_REQUIRED 不提示（下次会先弹滑块）；其余错误正常提示
        if (e.code !== CAPTCHA_REQUIRED_CODE) {
          showError(e.message);
        }
      }
      // 用户取消滑块（非 ApiException）静默
    } finally {
      setSubmitting(false);
    }
  };

  const switchTab = (next: TabKey) => {
    if (next === tab) return;
    setTab(next);
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="font-heading font-bold text-2xl mb-2">{t('title')}</h2>
        <p className="text-muted-foreground text-sm">
          {tab === 'sms' ? t('subtitle') : ''}
        </p>
      </div>

      {/* Tab 切换 */}
      <div className="mb-6 inline-flex rounded-xl bg-muted/50 p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => switchTab('sms')}
          className={cn(
            'px-5 h-9 rounded-lg transition-all',
            tab === 'sms'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t('tabSms')}
        </button>
        <button
          type="button"
          onClick={() => switchTab('username')}
          className={cn(
            'px-5 h-9 rounded-lg transition-all',
            tab === 'username'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t('tabUsername')}
        </button>
      </div>

      {tab === 'sms' ? (
        <form onSubmit={handleSmsSubmit} className="space-y-6">
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
                name="phone"
                autoComplete="tel"
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

          {/* 协议 */}
          <AgreementCheckbox
            id="agreement-sms"
            checked={agreed}
            onChange={setAgreed}
            t={t}
          />

          {/* 提交 */}
          <SubmitButton
            submitting={submitting}
            disabled={!canSubmitSms}
            label={t('submit')}
          />
        </form>
      ) : (
        <form onSubmit={handleUsernameSubmit} className="space-y-6">
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
                onChange={(e) => setUsername(e.target.value.trim())}
                placeholder={t('usernamePlaceholder')}
                className="w-full h-12 pl-11 pr-4 bg-muted/50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-foreground text-base placeholder:text-muted-foreground/50 transition-all outline-none"
              />
            </div>
          </div>

          {/* 密码 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-muted-foreground tracking-widest uppercase">
                {t('passwordLabel')}
              </label>
              <Link
                href={ROUTES.FORGOT_PASSWORD}
                className="text-xs text-primary hover:underline"
              >
                {t('forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                <Lock className="size-4 text-muted-foreground/60" />
              </div>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                maxLength={PASSWORD_MAX}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                className="w-full h-12 pl-11 pr-4 bg-muted/50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-foreground text-base placeholder:text-muted-foreground/50 transition-all outline-none"
              />
            </div>
          </div>

          {/* 协议 */}
          <AgreementCheckbox
            id="agreement-username"
            checked={agreed}
            onChange={setAgreed}
            t={t}
          />

          {/* 提交 */}
          <SubmitButton
            submitting={submitting}
            disabled={!canSubmitUsername}
            label={t('submitPassword')}
          />
        </form>
      )}

      {/* 去注册 — 两个 tab 共用 */}
      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">{t('noAccount')}</span>
        <Link
          href={ROUTES.REGISTER}
          className="ml-1 text-primary font-semibold hover:underline"
        >
          {t('registerLink')}
        </Link>
      </div>

      {/* 社交登录入口暂未实现，先隐藏 */}

      {/* DEV 环境调试弹窗 — 显示 Mock 验证码 */}
      {IS_MOCK_SMS && devCode && (
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

function AgreementCheckbox({
  id,
  checked,
  onChange,
  t,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-1 flex items-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="size-4 rounded border-border text-primary focus:ring-primary/20 focus:ring-offset-0 transition-all"
        />
      </div>
      <label htmlFor={id} className="text-xs text-muted-foreground leading-relaxed">
        {t('agreement')}
        <Link
          href={LEGAL_TERMS_PATH}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer text-primary font-semibold hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {t('termsLink')}
        </Link>
        {t('and')}
        <Link
          href={LEGAL_PRIVACY_PATH}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer text-primary font-semibold hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {t('privacyLink')}
        </Link>
      </label>
    </div>
  );
}

function SubmitButton({
  submitting,
  disabled,
  label,
}: {
  submitting: boolean;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={cn(
        'w-full h-12 bg-gradient-to-r from-[#be0003] to-primary text-white font-heading font-bold text-base rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all',
        !disabled
          ? 'hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]'
          : 'opacity-60 cursor-not-allowed',
      )}
    >
      {submitting ? (
        <Loader2 className="size-5 animate-spin" />
      ) : (
        <>
          <span>{label}</span>
          <ArrowRight className="size-4" />
        </>
      )}
    </button>
  );
}
