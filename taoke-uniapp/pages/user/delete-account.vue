<!--
  注销账号 — DELETE /users/me
-->
<template>
  <view class="page">
    <TkNavBar title="注销账号" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <text class="desc">
          注销账号是不可恢复的硬删除操作。我们建议您在注销前先确认这些事项：
        </text>

        <view class="tips">
          <text class="tips__item">· 账号下的全部角色身份（专家、经纪人、机构等）将被一并删除。</text>
          <text class="tips__item">· 所有绑定关系（经纪人 ↔ 专家、机构 ↔ 员工等）也将被解除。</text>
        </view>

        <view class="account-box">
          <text class="account-box__line">
            当前账号：<text class="account-box__strong">{{ nickname }}</text>
            <text v-if="phone" class="account-box__muted"> {{ phone }}</text>
          </text>
          <text class="account-box__sub">点击下方按钮注销该账号，操作完成后将自动跳转到登录页。</text>
          <view class="account-box__btn" @tap="openConfirm">
            <text class="account-box__btn-txt">注销账号</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useUserStore } from '@/stores/user';
import * as userApi from '@/api/user';
import { getNavBarHeight } from '@/utils/system';

const navBarH = getNavBarHeight();
const userStore = useUserStore();
const submitting = ref(false);

const nickname = computed(() => userStore.nickname || '—');
const phone = computed(() => userStore.profile?.phone || '');

function openConfirm() {
  uni.showModal({
    title: '确认注销整个账号',
    content: '注销后将立即硬删除账号基本信息、全部角色身份与绑定关系。此操作不可恢复，请谨慎确认。',
    confirmText: '确认注销',
    confirmColor: '#DC2626',
    success: (res) => {
      if (res.confirm) handleDelete();
    },
  });
}

async function handleDelete() {
  if (submitting.value) return;
  submitting.value = true;
  uni.showLoading({ title: '正在注销...' });
  try {
    await userApi.deleteOwnAccount();
    uni.hideLoading();
    uni.showToast({ title: '账号已注销', icon: 'none' });
    userStore.logout({ redirectToLogin: true });
  } catch (_) {
    uni.hideLoading();
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: $tk-bg-page;
}

.page__scroll {
  height: 100vh;
  box-sizing: border-box;
}

.page__inner {
  padding: $tk-sp-4;
  display: flex;
  flex-direction: column;
  gap: $tk-sp-4;
}

.desc {
  font-size: $tk-fs-sm;
  color: $tk-text-3;
  line-height: 1.6;
}

.tips {
  display: flex;
  flex-direction: column;
  gap: 12rpx;

  &__item {
    font-size: $tk-fs-sm;
    color: $tk-text-2;
    line-height: 1.5;
  }
}

.account-box {
  padding: $tk-sp-4;
  background: rgba(239, 68, 68, 0.05);
  border: 2rpx solid rgba(239, 68, 68, 0.20);
  border-radius: $tk-radius-lg;

  &__line {
    font-size: $tk-fs-sm;
    color: $tk-text-2;
  }

  &__strong {
    font-weight: 700;
    color: $tk-text-1;
  }

  &__muted {
    color: $tk-text-4;
  }

  &__sub {
    display: block;
    margin-top: 12rpx;
    font-size: $tk-fs-xs;
    color: $tk-text-3;
    line-height: 1.5;
  }

  &__btn {
    margin-top: $tk-sp-3;
    padding: 20rpx 0;
    background: #DC2626;
    border-radius: $tk-radius-md;
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
