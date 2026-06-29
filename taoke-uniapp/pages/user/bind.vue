<!--
  账号绑定 — 手机端可完成绑定（PDF 3 要求）
  微信小程序：需先绑定手机号；微信登录视为已关联
-->
<template>
  <view class="page">
    <TkNavBar title="账号绑定" left-icon="back" />

    <scroll-view scroll-y class="page__scroll" :style="{ paddingTop: navBarH + 'px' }">
      <view class="page__inner">
        <view v-if="!hasPhone" class="warn">
          <text class="warn__txt">绑定第三方账号前，请先在「基础信息」中完成手机号绑定。</text>
          <view class="warn__btn" @tap="goProfile">
            <text class="warn__btn-txt">去绑定手机号</text>
          </view>
        </view>

        <text class="desc">绑定第三方账号后可使用对应方式快捷登录。</text>

        <view class="list">
          <view v-for="item in bindings" :key="item.key" class="row">
            <view class="row__main">
              <text class="row__name">{{ item.name }}</text>
              <text v-if="item.hint" class="row__hint">{{ item.hint }}</text>
            </view>
            <view
              class="row__btn"
              :class="{ 'row__btn--disabled': item.disabled }"
              @tap="onBind(item)"
            >
              <text class="row__btn-txt">{{ item.actionLabel }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/stores/user';
import { getNavBarHeight } from '@/utils/system';

const navBarH = getNavBarHeight();
const userStore = useUserStore();

const hasPhone = computed(() => !!userStore.profile?.phone);

// #ifdef MP-WEIXIN
const isWeixinMp = true;
// #endif
// #ifndef MP-WEIXIN
const isWeixinMp = false;
// #endif

const bindings = computed(() => [
  {
    key: 'wechat',
    name: '微信',
    hint: isWeixinMp ? '当前小程序已通过微信环境登录' : '',
    actionLabel: isWeixinMp ? '已关联' : '去绑定',
    disabled: isWeixinMp || !hasPhone.value,
  },
  {
    key: 'alipay',
    name: '支付宝',
    hint: '需在手机浏览器或支付宝内完成授权',
    actionLabel: '去绑定',
    disabled: !hasPhone.value,
  },
  {
    key: 'wework',
    name: '企业微信',
    hint: '需在手机企业微信内完成授权',
    actionLabel: '去绑定',
    disabled: !hasPhone.value,
  },
]);

onShow(() => {
  if (userStore.isLoggedIn) userStore.fetchProfile();
});

function goProfile() {
  uni.navigateTo({ url: '/pages/user/profile' });
}

function onBind(item) {
  if (!hasPhone.value) {
    uni.showToast({ title: '请先绑定手机号', icon: 'none' });
    return;
  }
  if (item.disabled && item.key === 'wechat') {
    uni.showToast({ title: '微信小程序已自动关联微信账号', icon: 'none' });
    return;
  }
  uni.showModal({
    title: `${item.name}绑定`,
    content: `${item.name}授权绑定接口即将上线。您已满足手机号前置条件，开放后将可直接在本页面完成绑定。`,
    showCancel: false,
  });
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: $tk-bg-page;
}
.page__scroll { height: 100vh; }
.page__inner {
  padding: $tk-sp-4;
  display: flex;
  flex-direction: column;
  gap: $tk-sp-4;
}

.warn {
  background: rgba(245, 158, 11, 0.12);
  border: 2rpx solid rgba(245, 158, 11, 0.3);
  border-radius: $tk-radius-lg;
  padding: $tk-sp-4;
  display: flex;
  flex-direction: column;
  gap: $tk-sp-3;

  &__txt { font-size: $tk-fs-sm; color: #B45309; line-height: 1.6; }
  &__btn {
    align-self: flex-start;
    padding: 12rpx 28rpx;
    background: #F59E0B;
    border-radius: $tk-radius-full;
  }
  &__btn-txt { color: #fff; font-size: $tk-fs-sm; font-weight: 600; }
}

.desc { font-size: $tk-fs-sm; color: $tk-text-3; }

.list { display: flex; flex-direction: column; gap: $tk-sp-2; }

.row {
  background: $tk-bg-card;
  border-radius: $tk-radius-lg;
  padding: $tk-sp-4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $tk-sp-3;
  box-shadow: $tk-shadow-card;

  &__main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6rpx; }
  &__name { font-size: $tk-fs-md; font-weight: 600; color: $tk-text-1; }
  &__hint { font-size: $tk-fs-xs; color: $tk-text-4; line-height: 1.5; }
  &__btn {
    flex-shrink: 0;
    padding: 12rpx 24rpx;
    border: 2rpx solid $tk-primary;
    border-radius: $tk-radius-full;
    &--disabled { opacity: 0.55; border-color: $tk-divider; }
  }
  &__btn-txt { font-size: $tk-fs-xs; color: $tk-primary; font-weight: 600; }
}
</style>
