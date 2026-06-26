<!--
  注册页（与 frontend src/features/auth/components/RegisterForm.tsx UX 对齐）
  - 用户名（4-32 字母/数字/下划线），失焦后调用 /auth/username/available 校验
  - 密码（6-32）+ 确认密码（实时一致校验）
  - 协议同意
  - 注册成功后接口直接返回 token，自动登录并跳首页
  - 底部"已有账号？去登录"
-->
<template>
  <view class="page">
    <TkNavBar title="注册" left-icon="back" />

    <view class="page__body" :style="{ paddingTop: navBarH + 'px' }">
      <!-- 品牌区 -->
      <view class="brand">
        <text class="brand__title">注册淘课网</text>
        <text class="brand__sub">用账号密码 30 秒完成注册</text>
      </view>

      <!-- 内联错误 -->
      <view v-if="error" class="error-banner">
        <text class="error-banner__txt">{{ error }}</text>
      </view>

      <!-- 表单 -->
      <view class="form">
        <!-- 用户名 -->
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
              @blur="onUsernameBlur"
            />
            <view v-if="usernameStatus === 'checking'" class="field__suffix">
              <text class="field__suffix-txt field__suffix-txt--muted">检查中…</text>
            </view>
            <view v-else-if="usernameStatus === 'available'" class="field__suffix">
              <TkIcon name="success" :size="28" color="#16A34A" />
            </view>
            <view v-else-if="usernameStatus === 'taken' || usernameStatus === 'invalid'" class="field__suffix">
              <TkIcon name="close" :size="28" color="#E62117" />
            </view>
          </view>
          <text class="field__hint" :class="usernameHintClass">{{ usernameHint }}</text>
        </view>

        <!-- 密码 -->
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
              <TkIcon name="eye" :filled="!showPassword" :size="32" color="#999" />
            </view>
          </view>
          <text v-if="password && password.length < PASSWORD_MIN" class="field__hint field__hint--error">
            密码至少 {{ PASSWORD_MIN }} 位
          </text>
        </view>

        <!-- 确认密码 -->
        <view class="field">
          <text class="field__label">确认密码</text>
          <view class="field__row">
            <input
              class="field__input"
              :type="showConfirm ? 'text' : 'password'"
              :value="confirmPassword"
              placeholder="再次输入密码"
              placeholder-style="color:#999"
              maxlength="32"
              @input="onConfirmInput"
            />
            <view class="field__suffix" @tap="showConfirm = !showConfirm">
              <TkIcon name="eye" :filled="!showConfirm" :size="32" color="#999" />
            </view>
          </view>
          <text v-if="confirmPassword && confirmPassword !== password" class="field__hint field__hint--error">
            两次密码不一致
          </text>
        </view>
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
        <text class="primary-btn__txt">{{ submitting ? '注册中...' : '注册' }}</text>
      </view>

      <!-- 登录链接 -->
      <view class="bottom-link">
        <text class="bottom-link__muted">已有账号？</text>
        <text class="bottom-link__action" @tap="goLogin">去登录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useUserStore } from '@/stores/user';
import * as authApi from '@/api/auth';

import { getNavBarHeight } from '@/utils/system';

const navBarH = getNavBarHeight();
const userStore = useUserStore();

const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirm = ref(false);
const agreed = ref(false);
const error = ref('');
const submitting = ref(false);

// 'idle' | 'checking' | 'available' | 'taken' | 'invalid'
const usernameStatus = ref('idle');

const USERNAME_REGEX = /^[a-zA-Z0-9_]{4,32}$/;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 32;

const usernameFormatValid = computed(() => USERNAME_REGEX.test(username.value));

const usernameHint = computed(() => {
  switch (usernameStatus.value) {
    case 'checking':  return '检查可用性中…';
    case 'available': return '账号可用';
    case 'taken':     return '该账号已被占用';
    case 'invalid':   return '账号格式不正确（4-32 位字母 / 数字 / 下划线）';
    default:          return '账号注册后不可修改，请谨慎选择';
  }
});

const usernameHintClass = computed(() => {
  switch (usernameStatus.value) {
    case 'available': return 'field__hint--success';
    case 'taken':
    case 'invalid':   return 'field__hint--error';
    default:          return '';
  }
});

const canSubmit = computed(
  () =>
    usernameFormatValid.value
    && usernameStatus.value !== 'taken'
    && usernameStatus.value !== 'checking'
    && password.value.length >= PASSWORD_MIN
    && password.value.length <= PASSWORD_MAX
    && confirmPassword.value === password.value
    && agreed.value
    && !submitting.value,
);

function onUsernameInput(e) {
  const v = (e.detail.value || '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 32);
  username.value = v;
  if (usernameStatus.value !== 'idle') usernameStatus.value = 'idle';
}

async function onUsernameBlur() {
  if (!username.value) {
    usernameStatus.value = 'idle';
    return;
  }
  if (!usernameFormatValid.value) {
    usernameStatus.value = 'invalid';
    return;
  }
  usernameStatus.value = 'checking';
  try {
    const ok = await authApi.checkUsernameAvailable(username.value);
    usernameStatus.value = ok ? 'available' : 'taken';
  } catch (_) {
    usernameStatus.value = 'idle';
  }
}

function onPasswordInput(e) {
  password.value = (e.detail.value || '').slice(0, 32);
}
function onConfirmInput(e) {
  confirmPassword.value = (e.detail.value || '').slice(0, 32);
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
    await userStore.registerByUsername({ username: username.value, password: password.value });
    uni.showToast({ title: '注册成功', icon: 'success' });
    setTimeout(() => uni.switchTab({ url: '/pages/home/index' }), 600);
  } catch (e) {
    if (!e || (e.code !== 401 && e.code !== 10001)) {
      error.value = e?.message || '注册失败';
    }
  } finally {
    submitting.value = false;
  }
}

function goLogin() {
  // 优先回退（来自 login 页 → 此页），否则 reLaunch
  uni.navigateBack({
    fail: () => uni.reLaunch({ url: '/pages/auth/login' }),
  });
}

function onTermsTap() {
  uni.showToast({ title: '《用户服务协议》页建设中', icon: 'none' });
}
function onPrivacyTap() {
  uni.showToast({ title: '《隐私政策》页建设中', icon: 'none' });
}
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

    &--muted {
      color: $tk-text-4;
    }
  }
  &__hint {
    font-size: $tk-fs-xs;
    color: $tk-text-4;
    padding-left: 8rpx;
    line-height: $tk-lh-normal;

    &--success {
      color: $tk-success;
    }
    &--error {
      color: $tk-primary;
    }
  }
}

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
</style>
