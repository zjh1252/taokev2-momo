<!--
  登录页（与 frontend src/features/auth/components/LoginForm.tsx UX 对齐）
  双 tab：手机号登录 / 账号登录
  - 手机号登录：phone (11) + 6 位短信码 + 60s 倒计时；dev 模式自动拉 mock-code 弹窗
  - 账号登录：username (4-32 字母数字下划线) + password (6-32)
  - 协议同意 checkbox + 内联红条错误
  - 底部"还没有账号？去注册"
-->
<template>
  <view class="page">
    <TkNavBar title="登录" left-icon="back" />

    <view class="page__body" :style="{ paddingTop: navBarH + 'px' }">
      <!-- 品牌区 -->
      <view class="brand">
        <text class="brand__title">欢迎登录淘课网</text>
        <text class="brand__sub">{{ tab === 'sms' ? '未注册手机号将自动创建账号' : '使用账号密码登录' }}</text>
      </view>

      <!-- Tab 切换 -->
      <view class="tabs">
        <view class="tabs__item" :class="{ 'is-active': tab === 'sms' }" @tap="switchTab('sms')">
          <text class="tabs__txt">手机号登录</text>
        </view>
        <view class="tabs__item" :class="{ 'is-active': tab === 'username' }" @tap="switchTab('username')">
          <text class="tabs__txt">账号登录</text>
        </view>
      </view>

      <!-- 内联错误 -->
      <view v-if="error" class="error-banner">
        <text class="error-banner__txt">{{ error }}</text>
      </view>

      <!-- 表单 -->
      <view class="form">
        <!-- 手机号登录 -->
        <template v-if="tab === 'sms'">
          <view class="field">
            <text class="field__label">手机号</text>
            <view class="field__row">
              <text class="field__prefix">+86</text>
              <input
                class="field__input"
                type="number"
                :value="phone"
                placeholder="请输入 11 位手机号"
                placeholder-style="color:#999"
                maxlength="11"
                @input="onPhoneInput"
              />
            </view>
          </view>

          <view class="field">
            <text class="field__label">验证码</text>
            <view class="field__row">
              <input
                class="field__input"
                type="number"
                :value="code"
                placeholder="6 位短信验证码"
                placeholder-style="color:#999"
                maxlength="6"
                @input="onCodeInput"
              />
              <view
                class="field__suffix"
                :class="{ 'is-disabled': !canSendCode }"
                @tap="handleSendCode"
              >
                <text class="field__suffix-txt">
                  {{ sendingCode ? '发送中...' : countdown > 0 ? `${countdown}秒后重发` : '获取验证码' }}
                </text>
              </view>
            </view>
          </view>
        </template>

        <!-- 账号登录 -->
        <template v-else>
          <view class="field">
            <text class="field__label">账号</text>
            <view class="field__row">
              <input
                class="field__input"
                :value="username"
                placeholder="4-32 位字母 / 数字 / 下划线"
                placeholder-style="color:#999"
                maxlength="32"
                @input="onUsernameInput"
              />
            </view>
          </view>

          <view class="field">
            <text class="field__label">密码</text>
            <view class="field__row">
              <input
                class="field__input"
                :type="showPassword ? 'text' : 'password'"
                :value="password"
                placeholder="6-32 位密码"
                placeholder-style="color:#999"
                maxlength="32"
                @input="onPasswordInput"
              />
              <view class="field__suffix" @tap="showPassword = !showPassword">
                <TkIcon :name="showPassword ? 'eye' : 'eye'" :filled="!showPassword" :size="32" color="#999" />
              </view>
            </view>
          </view>
        </template>
      </view>

      <!-- 协议 -->
      <view class="agreement" @tap="agreed = !agreed">
        <view class="agreement__box" :class="{ 'is-checked': agreed }">
          <TkIcon v-if="agreed" name="success" :size="22" color="#fff" />
        </view>
        <text class="agreement__txt">
          我已阅读并同意
          <text class="agreement__link" @tap.stop="onTermsTap">《用户服务协议》</text>
          和
          <text class="agreement__link" @tap.stop="onPrivacyTap">《隐私政策》</text>
        </text>
      </view>

      <!-- 主按钮 -->
      <view
        class="primary-btn"
        :class="{ 'is-disabled': !canSubmit }"
        @tap="onSubmit"
      >
        <text class="primary-btn__txt">{{ submitting ? '登录中...' : '登录' }}</text>
      </view>

      <!-- 注册链接 -->
      <view class="bottom-link">
        <text class="bottom-link__muted">还没有账号？</text>
        <text class="bottom-link__action" @tap="goRegister">去注册</text>
      </view>
    </view>

    <!-- dev mock 验证码弹窗 -->
    <view v-if="isMockSms && devCode" class="mock-mask" @tap.stop>
      <view class="mock-card">
        <view class="mock-card__icon">
          <TkIcon name="info-filled" :size="48" color="#F59E0B" />
        </view>
        <text class="mock-card__title">开发环境调试</text>
        <text class="mock-card__desc">你正处于测试环境，请使用以下验证码登录：</text>
        <view class="mock-card__code-row">
          <text class="mock-card__code">{{ devCode }}</text>
          <view class="mock-card__copy" @tap="onCopyDevCode">
            <TkIcon name="paperclip" :size="28" color="#666" />
          </view>
        </view>
        <text class="mock-card__hint">验证码已自动填入输入框</text>
        <view class="mock-card__btn" @tap="devCode = ''">
          <text class="mock-card__btn-txt">知道了</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import * as authApi from '@/api/auth';
import config from '@/configs';
import { withCaptcha } from '@/utils/captcha';

import { getNavBarHeight } from '@/utils/system';

const navBarH = getNavBarHeight();
const userStore = useUserStore();

// dev=true / prod=false（与 configs/env.js 中 MOCK_SMS 一致）
const isMockSms = config.mockSms;

const tab = ref('sms');           // 'sms' | 'username'
const phone = ref('');
const code = ref('');
const username = ref('');
const password = ref('');
const showPassword = ref(false);
const agreed = ref(false);
const error = ref('');
const submitting = ref(false);
const redirect = ref('');

// SMS 倒计时
const countdown = ref(0);
const sendingCode = ref(false);
const devCode = ref('');
const pwdCaptchaRequired = ref(false);
let countdownTimer = null;

const USERNAME_REGEX = /^[a-zA-Z0-9_]{4,32}$/;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 32;
const COUNTDOWN_SECONDS = 60;

const canSendCode = computed(
  () => phone.value.length === 11 && countdown.value === 0 && !sendingCode.value,
);
const canSubmitSms = computed(
  () => phone.value.length === 11 && code.value.length === 6 && agreed.value && !submitting.value,
);
const canSubmitUsername = computed(
  () =>
    USERNAME_REGEX.test(username.value)
    && password.value.length >= PASSWORD_MIN
    && password.value.length <= PASSWORD_MAX
    && agreed.value
    && !submitting.value,
);
const canSubmit = computed(() => (tab.value === 'sms' ? canSubmitSms.value : canSubmitUsername.value));

onLoad((opt) => {
  redirect.value = opt?.redirect || '';
});

function switchTab(t) {
  if (tab.value === t) return;
  tab.value = t;
  error.value = '';
}

function onPhoneInput(e) {
  phone.value = (e.detail.value || '').replace(/\D/g, '').slice(0, 11);
}
function onCodeInput(e) {
  code.value = (e.detail.value || '').replace(/\D/g, '').slice(0, 6);
}
function onUsernameInput(e) {
  username.value = (e.detail.value || '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 32);
}
function onPasswordInput(e) {
  password.value = (e.detail.value || '').slice(0, 32);
}

function startCountdown() {
  countdown.value = COUNTDOWN_SECONDS;
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }, 1000);
}

async function handleSendCode() {
  if (!canSendCode.value) return;
  error.value = '';
  sendingCode.value = true;
  try {
    await withCaptcha((token, silent) =>
      authApi.sendCode(
        { target: phone.value, type: 'LOGIN', sendType: 'SMS', captchaToken: token },
        { silent },
      ),
    );
    startCountdown();

    if (isMockSms) {
      try {
        const c = await authApi.getMockCode(phone.value);
        const codeStr = typeof c === 'string' ? c : c?.code || c?.data || '';
        if (codeStr) {
          code.value = String(codeStr);
          devCode.value = String(codeStr);
        }
      } catch (_) { /* mock 接口未启用时不影响主流程 */ }
    }
  } catch (e) {
    if (!e || (e.code !== 401 && e.code !== 10001)) {
      error.value = e?.message || '发送验证码失败';
    }
  } finally {
    sendingCode.value = false;
  }
}

async function onSubmit() {
  if (!canSubmit.value) {
    if (!agreed.value) {
      error.value = '请先勾选用户协议';
      return;
    }
    return;
  }
  error.value = '';
  submitting.value = true;
  try {
    if (tab.value === 'sms') {
      await userStore.loginBySms({ phone: phone.value, code: code.value });
    } else {
      try {
        await userStore.loginByUsername({
          username: username.value,
          password: password.value,
        });
      } catch (e) {
        if (e?.code === 10021) {
          pwdCaptchaRequired.value = true;
          await withCaptcha((token) =>
            userStore.loginByUsername({
              username: username.value,
              password: password.value,
              captchaToken: token,
            }),
          );
        } else {
          throw e;
        }
      }
    }
    finishLogin();
  } catch (e) {
    if (!e || (e.code !== 401 && e.code !== 10001)) {
      error.value = e?.message || '登录失败';
    }
  } finally {
    submitting.value = false;
  }
}

function finishLogin() {
  uni.showToast({ title: '登录成功', icon: 'success' });
  setTimeout(() => {
    if (redirect.value) {
      uni.reLaunch({ url: redirect.value });
    } else {
      uni.switchTab({ url: '/pages/home/index' });
    }
  }, 600);
}

function goRegister() {
  uni.navigateTo({ url: '/pages/auth/register' });
}

function onTermsTap() {
  uni.showToast({ title: '《用户服务协议》页建设中', icon: 'none' });
}
function onPrivacyTap() {
  uni.showToast({ title: '《隐私政策》页建设中', icon: 'none' });
}

function onCopyDevCode() {
  if (!devCode.value) return;
  uni.setClipboardData({
    data: devCode.value,
    success: () => uni.showToast({ title: '已复制', icon: 'none' }),
  });
}

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
});
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: $tk-bg-page;
}
.page__body {
  padding: $tk-sp-5 $tk-sp-4 $tk-sp-6;
  display: flex;
  flex-direction: column;
  gap: $tk-sp-4;
}

// 品牌区
.brand {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: $tk-sp-3 0 $tk-sp-2;

  &__title {
    font-size: 56rpx;
    font-weight: 800;
    color: $tk-text-1;
    line-height: $tk-lh-tight;
  }
  &__sub {
    font-size: $tk-fs-md;
    color: $tk-text-2;
  }
}

// Tab
.tabs {
  display: inline-flex;
  align-self: flex-start;
  background: rgba(0, 0, 0, 0.04);
  border-radius: $tk-radius-md;
  padding: 4rpx;

  &__item {
    padding: 12rpx 24rpx;
    border-radius: $tk-radius-sm;
  }
  &__txt {
    font-size: $tk-fs-md;
    color: $tk-text-2;
    font-weight: 600;
  }
  &__item.is-active {
    background: $tk-bg-card;
    box-shadow: $tk-shadow-card;

    .tabs__txt {
      color: $tk-text-1;
    }
  }
}

// 错误条
.error-banner {
  background: rgba(230, 33, 23, 0.08);
  border: 2rpx solid rgba(230, 33, 23, 0.30);
  border-radius: $tk-radius-md;
  padding: $tk-sp-2 $tk-sp-3;

  &__txt {
    font-size: $tk-fs-sm;
    color: $tk-primary;
  }
}

// 表单
.form {
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-4 $tk-sp-3;
  display: flex;
  flex-direction: column;
  gap: $tk-sp-3;
  box-shadow: $tk-shadow-card;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8rpx;

  &__label {
    font-size: $tk-fs-sm;
    color: $tk-text-2;
    padding-left: 8rpx;
  }
  &__row {
    display: flex;
    align-items: center;
    height: 96rpx;
    background: $tk-bg-page;
    border-radius: $tk-radius-md;
    padding: 0 $tk-sp-3;
    gap: $tk-sp-2;
  }
  &__prefix {
    flex-shrink: 0;
    font-size: $tk-fs-md;
    color: $tk-text-2;
    border-right: 2rpx solid $tk-divider-light;
    padding-right: $tk-sp-2;
  }
  &__input {
    flex: 1;
    height: 100%;
    font-size: $tk-fs-md;
    color: $tk-text-1;
    background: transparent;
  }
  &__suffix {
    flex-shrink: 0;
    padding: 0 $tk-sp-2;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__suffix-txt {
    font-size: $tk-fs-sm;
    color: $tk-primary;
    font-weight: 600;
  }
  &__suffix.is-disabled {
    .field__suffix-txt {
      color: $tk-text-4;
    }
  }
}

// 协议
.agreement {
  display: flex;
  align-items: flex-start;
  gap: $tk-sp-2;
  padding: 0 8rpx;

  &__box {
    flex-shrink: 0;
    width: 36rpx;
    height: 36rpx;
    margin-top: 4rpx;
    border-radius: $tk-radius-xs;
    border: 2rpx solid $tk-divider;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $tk-bg-card;

    &.is-checked {
      background: $tk-primary;
      border-color: $tk-primary;
    }
  }
  &__txt {
    flex: 1;
    font-size: $tk-fs-sm;
    color: $tk-text-2;
    line-height: $tk-lh-normal;
  }
  &__link {
    color: $tk-primary;
  }
}

// 主按钮
.primary-btn {
  height: 96rpx;
  border-radius: $tk-radius-full;
  background: linear-gradient(135deg, $tk-primary 0%, #FF8C00 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: $tk-shadow-primary;

  &__txt {
    color: #fff;
    font-size: $tk-fs-lg;
    font-weight: 700;
  }
  &.is-disabled {
    opacity: 0.45;
    box-shadow: none;
  }
}

// 注册链接
.bottom-link {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8rpx;
  padding: $tk-sp-2 0;

  &__muted {
    font-size: $tk-fs-sm;
    color: $tk-text-2;
  }
  &__action {
    font-size: $tk-fs-sm;
    color: $tk-primary;
    font-weight: 600;
  }
}

// dev mock 弹窗
.mock-mask {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 $tk-sp-5;
}

.mock-card {
  width: 100%;
  max-width: 600rpx;
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-5 $tk-sp-4;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $tk-sp-2;
  box-shadow: $tk-shadow-pop;

  &__icon {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    background: rgba(245, 158, 11, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8rpx;
  }
  &__title {
    font-size: $tk-fs-lg;
    font-weight: 700;
    color: $tk-text-1;
  }
  &__desc {
    font-size: $tk-fs-sm;
    color: $tk-text-2;
    text-align: center;
    line-height: $tk-lh-normal;
  }
  &__code-row {
    margin-top: $tk-sp-2;
    padding: $tk-sp-3 $tk-sp-4;
    background: $tk-bg-page;
    border-radius: $tk-radius-md;
    display: flex;
    align-items: center;
    gap: $tk-sp-3;
  }
  &__code {
    font-size: 64rpx;
    font-weight: 800;
    color: $tk-primary;
    letter-spacing: 12rpx;
    font-family: monospace;
  }
  &__copy {
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $tk-bg-card;
    box-shadow: $tk-shadow-card;
  }
  &__hint {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
    margin-top: 4rpx;
  }
  &__btn {
    margin-top: $tk-sp-3;
    width: 100%;
    height: 80rpx;
    border-radius: $tk-radius-full;
    background: $tk-primary;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__btn-txt {
    color: #fff;
    font-size: $tk-fs-md;
    font-weight: 600;
  }
}
</style>
