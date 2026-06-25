<!--
  修改密码（PUT /users/me/password）
  - 旧密码（如未设过密码可留空，参见 frontend）
  - 新密码：6-32 位
  - 确认密码：必须与新密码一致
  - 提交后清空表单 + toast；失败保留输入
-->
<template>
  <view class="page">
    <TkNavBar title="修改密码" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <view class="tip">
          <text class="tip__txt">为了账户安全，请定期修改密码。</text>
          <text class="tip__txt tip__txt--muted">
            如未设置过密码（如手机号一键注册），旧密码可留空。
          </text>
        </view>

        <view v-if="error" class="error-banner">
          <text class="error-banner__txt">{{ error }}</text>
        </view>

        <view class="form">
          <view class="row">
            <text class="row__label">旧密码</text>
            <view class="row__input-wrap">
              <input
                class="row__input"
                :type="showOld ? 'text' : 'password'"
                :value="oldPassword"
                placeholder="如从未设置过密码可留空"
                placeholder-style="color:#999"
                maxlength="32"
                @input="onInput('oldPassword', $event)"
              />
              <view class="row__suffix" @tap="showOld = !showOld">
                <TkIcon name="eye" :filled="!showOld" :size="32" color="#999" />
              </view>
            </view>
          </view>

          <view class="row">
            <text class="row__label">新密码</text>
            <view class="row__input-wrap">
              <input
                class="row__input"
                :type="showNew ? 'text' : 'password'"
                :value="newPassword"
                placeholder="6-32 位字符"
                placeholder-style="color:#999"
                maxlength="32"
                @input="onInput('newPassword', $event)"
              />
              <view class="row__suffix" @tap="showNew = !showNew">
                <TkIcon name="eye" :filled="!showNew" :size="32" color="#999" />
              </view>
            </view>
          </view>

          <view class="row row--last">
            <text class="row__label">确认新密码</text>
            <view class="row__input-wrap">
              <input
                class="row__input"
                :type="showConfirm ? 'text' : 'password'"
                :value="confirmPassword"
                placeholder="再次输入新密码"
                placeholder-style="color:#999"
                maxlength="32"
                @input="onInput('confirmPassword', $event)"
              />
              <view class="row__suffix" @tap="showConfirm = !showConfirm">
                <TkIcon name="eye" :filled="!showConfirm" :size="32" color="#999" />
              </view>
            </view>
          </view>
        </view>

        <text v-if="confirmPassword && confirmPassword !== newPassword" class="inline-err">
          两次输入的密码不一致
        </text>

        <view style="height: 200rpx;" />
      </view>
    </scroll-view>

    <TkActionBar>
      <TkActionBtn
        :label="saving ? '保存中...' : '保存修改'"
        type="primary"
        :disabled="!canSubmit"
        @tap="onSave"
      />
    </TkActionBar>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import * as userApi from '@/api/user';

import { getNavBarHeight } from '@/utils/system';

const navBarH = getNavBarHeight();

const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const showOld = ref(false);
const showNew = ref(false);
const showConfirm = ref(false);
const error = ref('');
const saving = ref(false);

const PASSWORD_MIN = 6;
const PASSWORD_MAX = 32;

const canSubmit = computed(
  () =>
    !saving.value
    && newPassword.value.length >= PASSWORD_MIN
    && newPassword.value.length <= PASSWORD_MAX
    && confirmPassword.value === newPassword.value,
);

function onInput(field, e) {
  const v = (e.detail.value || '').slice(0, 32);
  if (field === 'oldPassword') oldPassword.value = v;
  else if (field === 'newPassword') newPassword.value = v;
  else if (field === 'confirmPassword') confirmPassword.value = v;
}

async function onSave() {
  if (!canSubmit.value) {
    if (!newPassword.value) error.value = '请输入新密码';
    else if (newPassword.value.length < PASSWORD_MIN || newPassword.value.length > PASSWORD_MAX) {
      error.value = '密码长度为 6-32 位';
    } else if (confirmPassword.value !== newPassword.value) {
      error.value = '两次输入的密码不一致';
    }
    return;
  }
  error.value = '';
  saving.value = true;
  try {
    await userApi.changePassword({
      oldPassword: oldPassword.value || undefined,
      newPassword: newPassword.value,
    });
    oldPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    uni.showToast({ title: '密码修改成功', icon: 'success' });
    setTimeout(() => uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/user/index' }) }), 600);
  } catch (e) {
    if (!e || (e.code !== 401 && e.code !== 10001)) {
      error.value = e?.message || '密码修改失败，请检查旧密码是否正确';
    }
  } finally {
    saving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  background: $tk-bg-page;
}
.page__scroll {
  height: 100vh;
  box-sizing: border-box;
}
.page__inner {
  padding: $tk-sp-3 $tk-sp-3 $tk-sp-6;
  display: flex;
  flex-direction: column;
  gap: $tk-sp-3;
}

.tip {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  padding: 0 $tk-sp-2;

  &__txt {
    font-size: $tk-fs-sm;
    color: $tk-text-2;

    &--muted {
      color: $tk-text-3;
    }
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
  box-shadow: $tk-shadow-card;
  overflow: hidden;
}

.row {
  display: flex;
  align-items: center;
  padding: $tk-sp-3;
  gap: $tk-sp-3;
  border-bottom: 2rpx solid $tk-divider-light;

  &--last {
    border-bottom: none;
  }

  &__label {
    flex-shrink: 0;
    width: 200rpx;
    font-size: $tk-fs-sm;
    color: $tk-text-2;
  }
  &__input-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    gap: $tk-sp-2;
  }
  &__input {
    flex: 1;
    font-size: $tk-fs-md;
    color: $tk-text-1;
    text-align: right;
  }
  &__suffix {
    flex-shrink: 0;
  }
}

.inline-err {
  font-size: $tk-fs-xs;
  color: $tk-primary;
  padding: 0 $tk-sp-2;
}
</style>
